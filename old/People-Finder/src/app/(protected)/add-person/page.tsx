// src/app/(protected)/add-person/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Upload } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { 
  validateUserData, 
  validateContractData, 
  validateDiplomaData, 
  validateSkillData 
} from '@/lib/validation'
import { validateFile, generateStoragePath } from '@/lib/file-security'

interface Document {
  id: string;
  name: string;
  file: File;
  fileUrl?: string;
}

interface Contract {
  id: string;
  name: string;
  description: string;
  location: string;
  beneficiary: string;
  position: string;
  startDate: string;
  endDate: string;
  documents: Document[];
}

interface Diploma {
  id: string;
  name: string;
  issuer: string;
  date: string;
  documents: Document[];
}

interface Skill {
  id: string;
  name: string;
  level: 'Începător' | 'Intermediar' | 'Expert';
  type: 'Soft' | 'Hard';
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  contractType: string;
  company: string;
  department: string;
  expertise: string;
  observations: string;
}

export default function AddPersonPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    contractType: '',
    company: '',
    department: '',
    expertise: '',
    observations: ''
  })

  const [generalExperience, setGeneralExperience] = useState('')
  const [contracts, setContracts] = useState<Contract[]>([])
  const [diplomas, setDiplomas] = useState<Diploma[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [experienceByPosition, setExperienceByPosition] = useState<{[key: string]: number}>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Experience calculation functions
  useEffect(() => {
    calculateExperience();
  }, [contracts]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateExperience = () => {
    const expByPosition: {[key: string]: number} = {};
    
    contracts.forEach(contract => {
      if (contract.startDate && contract.endDate && contract.position) {
        const start = new Date(contract.startDate);
        const end = new Date(contract.endDate);
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (expByPosition[contract.position]) {
          expByPosition[contract.position] += years;
        } else {
          expByPosition[contract.position] = years;
        }
      }
    });

    setExperienceByPosition(expByPosition);
  };

  // Contract management
  const addContract = () => {
    const newContract: Contract = {
      id: Date.now().toString(),
      name: '',
      description: '',
      location: '',
      beneficiary: '',
      position: '',
      startDate: '',
      endDate: '',
      documents: []
    };
    setContracts([...contracts, newContract]);
  };

  const updateContract = (contractId: string, field: keyof Omit<Contract, 'id' | 'documents'>, value: string) => {
    setContracts(prevContracts =>
      prevContracts.map(contract =>
        contract.id === contractId
          ? { ...contract, [field]: value }
          : contract
      )
    );
  };

  const removeContract = (contractId: string) => {
    setContracts(prevContracts => prevContracts.filter(contract => contract.id !== contractId));
  };

  // Diploma management
  const addDiploma = () => {
    const newDiploma: Diploma = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
      documents: []
    };
    setDiplomas([...diplomas, newDiploma]);
  };

  const updateDiploma = (diplomaId: string, field: keyof Omit<Diploma, 'id' | 'documents'>, value: string) => {
    setDiplomas(prevDiplomas =>
      prevDiplomas.map(diploma =>
        diploma.id === diplomaId
          ? { ...diploma, [field]: value }
          : diploma
      )
    );
  };

  const removeDiploma = (diplomaId: string) => {
    setDiplomas(prevDiplomas => prevDiplomas.filter(diploma => diploma.id !== diplomaId));
  };

  // Skills management
  const addSkill = (type: 'Soft' | 'Hard') => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      level: 'Începător',
      type
    };
    setSkills([...skills, newSkill]);
  };

  const updateSkill = (skillId: string, field: keyof Omit<Skill, 'id'>, value: string) => {
    setSkills(prevSkills =>
      prevSkills.map(skill =>
        skill.id === skillId
          ? { ...skill, [field]: value }
          : skill
      )
    );
  };

  const removeSkill = (skillId: string) => {
    setSkills(prevSkills => prevSkills.filter(skill => skill.id !== skillId));
  };

  // File handling with security validation
  const handleFileUpload = async (
    file: File,
    parentId: string,
    category: 'contracts' | 'diplomas',
    userId: string
  ): Promise<string> => {
    try {
      // Validate file before upload
      const validation = validateFile(file, 'documents');
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file');
      }
      
      // Generate secure storage path
      const storagePath = generateStoragePath(userId, category, validation.sanitizedFileName!);
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const addDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId: string,
    category: 'contracts' | 'diplomas'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before adding
    const validation = validateFile(file, 'documents');
    if (!validation.isValid) {
      toast({
        title: "File Upload Error",
        description: validation.error || "Invalid file",
        variant: "destructive"
      });
      e.target.value = ''; // Clear the input
      return;
    }

    const newDocument: Document = {
      id: Date.now().toString(),
      name: file.name,
      file: file
    };

    if (category === 'contracts') {
      setContracts(prevContracts =>
        prevContracts.map(contract =>
          contract.id === parentId
            ? { ...contract, documents: [...contract.documents, newDocument] }
            : contract
        )
      );
    } else {
      setDiplomas(prevDiplomas =>
        prevDiplomas.map(diploma =>
          diploma.id === parentId
            ? { ...diploma, documents: [...diploma.documents, newDocument] }
            : diploma
        )
      );
    }
  };

  const removeDocument = (
    docId: string,
    parentId: string,
    category: 'contracts' | 'diplomas'
  ) => {
    if (category === 'contracts') {
      setContracts(prevContracts =>
        prevContracts.map(contract =>
          contract.id === parentId
            ? {
                ...contract,
                documents: contract.documents.filter(doc => doc.id !== docId)
              }
            : contract
        )
      );
    } else {
      setDiplomas(prevDiplomas =>
        prevDiplomas.map(diploma =>
          diploma.id === parentId
            ? {
                ...diploma,
                documents: diploma.documents.filter(doc => doc.id !== docId)
              }
            : diploma
        )
      );
    }
  };

  // Form submission

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!termsAccepted) {
    toast({
      title: "Error",
      description: "Please accept the terms and conditions",
      variant: "destructive"
    });
    return;
  }

  setLoading(true);

  try {
    // Validate user data
    const { isValid, errors, sanitizedData } = validateUserData({
      ...formData,
      contractType: formData.contractType as 'CIM' | 'PFA' | 'SRL'
    });
    
    if (!isValid) {
      const errorMessages = Object.entries(errors).map(([field, error]) => `${field}: ${error}`).join(', ');
      toast({
        title: "Validation Error",
        description: errorMessages,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validate contracts
    for (const contract of contracts) {
      const contractValidation = validateContractData({
        ...contract,
        startDate: new Date(contract.startDate),
        endDate: new Date(contract.endDate)
      });
      if (!contractValidation.isValid) {
        toast({
          title: "Contract Validation Error",
          description: `Contract "${contract.name}": ${Object.values(contractValidation.errors).join(', ')}`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
    }

    // Validate diplomas
    for (const diploma of diplomas) {
      const diplomaValidation = validateDiplomaData({
        ...diploma,
        date: new Date(diploma.date)
      });
      if (!diplomaValidation.isValid) {
        toast({
          title: "Diploma Validation Error",
          description: `Diploma "${diploma.name}": ${Object.values(diplomaValidation.errors).join(', ')}`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
    }

    // Validate skills
    for (const skill of skills) {
      const skillValidation = validateSkillData(skill);
      if (!skillValidation.isValid) {
        toast({
          title: "Skill Validation Error",
          description: `Skill "${skill.name}": ${Object.values(skillValidation.errors).join(', ')}`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
    }

    // Create user document with validated and sanitized data
    const userData = {
      ...sanitizedData,
      generalExperience: generalExperience 
       ? Timestamp.fromDate(new Date(generalExperience))
      : Timestamp.fromDate(new Date()),
       createdAt: Timestamp.now(),
       updatedAt: Timestamp.now()
    };

    const userRef = await addDoc(collection(db, 'users'), userData);

    // Process contracts
    const processedContracts = await Promise.all(
      contracts.map(async (contract) => {
        const documentUrls = await Promise.all(
          contract.documents.map(async (doc) => {
            const fileUrl = await handleFileUpload(doc.file, contract.id, 'contracts', userRef.id);
            return {
              name: doc.name,
              fileUrl
            };
          })
        );

        return {
          name: contract.name,
          description: contract.description,
          location: contract.location,
          beneficiary: contract.beneficiary,
          position: contract.position,
          startDate: Timestamp.fromDate(new Date(contract.startDate)),
          endDate: Timestamp.fromDate(new Date(contract.endDate)),
          documents: documentUrls,
          userId: userRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
      })
    );

    // Process diplomas
    const processedDiplomas = await Promise.all(
      diplomas.map(async (diploma) => {
        const documentUrls = await Promise.all(
          diploma.documents.map(async (doc) => {
            const fileUrl = await handleFileUpload(doc.file, diploma.id, 'diplomas', userRef.id);
            return {
              name: doc.name,
              fileUrl
            };
          })
        );

        return {
          name: diploma.name,
          issuer: diploma.issuer,
          date: Timestamp.fromDate(new Date(diploma.date)),
          documents: documentUrls,
          userId: userRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
      })
    );

    // Add contracts
    await Promise.all(
      processedContracts.map(contract =>
        addDoc(collection(db, 'contracts'), contract)
      )
    );

    // Add diplomas
    await Promise.all(
      processedDiplomas.map(diploma =>
        addDoc(collection(db, 'diplomas'), diploma)
      )
    );

    // Add skills
    await Promise.all(
      skills.map(skill =>
        addDoc(collection(db, 'skills'), {
          name: skill.name,
          level: skill.level,
          type: skill.type,
          userId: userRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      )
    );

    toast({
      title: "Success",
      description: "Person added successfully",
    });

    router.push(`/profile/${userRef.id}`);
  } catch (error) {
    console.error('Error adding person:', error);
    toast({
      title: "Error",
      description: "Failed to add person",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Add New Person</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-type">Contract Type</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => setFormData({...formData, contractType: value})}
                >
                  <SelectTrigger id="contract-type">
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIM">CIM</SelectItem>
                    <SelectItem value="PFA">PFA</SelectItem>
                    <SelectItem value="SRL">SRL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertise">Expertise</Label>
              <Textarea
                id="expertise"
                value={formData.expertise}
                onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                placeholder="Describe expertise (e.g., Supervisor, Design Engineer, Construction Engineer)"
              />
            </div>
          </CardContent>
        </Card>

        {/* General Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="general-experience">General Experience (Start Date)</Label>
            <Input
              id="general-experience"
              type="date"
              value={generalExperience}
              onChange={(e) => {
                const date = e.target.value;
                if (date) {
                  setGeneralExperience(date);
                }
              }}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              required
            />
          </div>
          </CardContent>
        </Card>
{/* Contracts Section */}
<Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Contracts</CardTitle>
            <Button variant="outline" size="sm" onClick={addContract}>
              <Plus className="h-4 w-4 mr-2" /> Add Contract
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-4 border rounded space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contract Name</Label>
                    <Input
                      value={contract.name}
                      onChange={(e) => updateContract(contract.id, 'name', e.target.value)}
                      placeholder="Contract name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={contract.description}
                      onChange={(e) => updateContract(contract.id, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={contract.location}
                      onChange={(e) => updateContract(contract.id, 'location', e.target.value)}
                      placeholder="Location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Beneficiary</Label>
                    <Input
                      value={contract.beneficiary}
                      onChange={(e) => updateContract(contract.id, 'beneficiary', e.target.value)}
                      placeholder="Beneficiary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={contract.position}
                      onChange={(e) => updateContract(contract.id, 'position', e.target.value)}
                      placeholder="Position"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={contract.startDate}
                      onChange={(e) => updateContract(contract.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={contract.endDate}
                      onChange={(e) => updateContract(contract.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Contract Documents */}
                <div className="mt-4 space-y-2">
                  <Label>Documents</Label>
                  {contract.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <span>{doc.name}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDocument(doc.id, contract.id, 'contracts')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id={`contract-file-${contract.id}`}
                      className="hidden"
                      onChange={(e) => addDocument(e, contract.id, 'contracts')}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`contract-file-${contract.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload Document
                    </Button>
                  </div>
                </div>

                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeContract(contract.id)}
                  className="mt-4"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Contract
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Experience Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Experience Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(experienceByPosition).map(([position, years]) => (
              <div key={position} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="font-medium">{position}</span>
                <span>{years.toFixed(1)} years</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Diplomas Section */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Diplomas</CardTitle>
            <Button variant="outline" size="sm" onClick={addDiploma}>
              <Plus className="h-4 w-4 mr-2" /> Add Diploma
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {diplomas.map((diploma) => (
              <div key={diploma.id} className="p-4 border rounded space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Diploma Name</Label>
                    <Input
                      value={diploma.name}
                      onChange={(e) => updateDiploma(diploma.id, 'name', e.target.value)}
                      placeholder="Diploma name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuer</Label>
                    <Input
                      value={diploma.issuer}
                      onChange={(e) => updateDiploma(diploma.id, 'issuer', e.target.value)}
                      placeholder="Issuer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={diploma.date}
                      onChange={(e) => updateDiploma(diploma.id, 'date', e.target.value)}
                    />
                  </div>
                </div>

                {/* Diploma Documents */}
                <div className="mt-4 space-y-2">
                  <Label>Documents</Label>
                  {diploma.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <span>{doc.name}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDocument(doc.id, diploma.id, 'diplomas')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id={`diploma-file-${diploma.id}`}
                      className="hidden"
                      onChange={(e) => addDocument(e, diploma.id, 'diplomas')}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`diploma-file-${diploma.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload Document
                    </Button>
                  </div>
                </div>

                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeDiploma(diploma.id)}
                  className="mt-4"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Diploma
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
{/* Skills Section */}
<div className="grid md:grid-cols-2 gap-6">
          {/* Soft Skills */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Soft Skills</CardTitle>
              <Button variant="outline" size="sm" onClick={() => addSkill('Soft')}>
                <Plus className="h-4 w-4 mr-2" /> Add Skill
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills
                .filter(skill => skill.type === 'Soft')
                .map((skill) => (
                  <div key={skill.id} className="p-4 border rounded space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Skill</Label>
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                          placeholder="Skill name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Select
                          value={skill.level}
                          onValueChange={(value) => updateSkill(skill.id, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Începător">Începător</SelectItem>
                            <SelectItem value="Intermediar">Intermediar</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removeSkill(skill.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Skill
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Hard Skills */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Hard Skills</CardTitle>
              <Button variant="outline" size="sm" onClick={() => addSkill('Hard')}>
                <Plus className="h-4 w-4 mr-2" /> Add Skill
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills
                .filter(skill => skill.type === 'Hard')
                .map((skill) => (
                  <div key={skill.id} className="p-4 border rounded space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Skill</Label>
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                          placeholder="Skill name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Select
                          value={skill.level}
                          onValueChange={(value) => updateSkill(skill.id, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Începător">Începător</SelectItem>
                            <SelectItem value="Intermediar">Intermediar</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removeSkill(skill.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Skill
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Observations */}
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observations}
              onChange={(e) => setFormData({...formData, observations: e.target.value})}
              placeholder="Add observations (e.g., Advanced Excel, Travel availability, Relocation availability)"
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Terms and Submit */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="terms"
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
            />
            <Label htmlFor="terms">I entered all the required data.</Label>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !termsAccepted}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Person...
              </span>
            ) : (
              'Add Person'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
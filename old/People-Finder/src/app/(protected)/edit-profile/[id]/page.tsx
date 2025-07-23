'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { db, storage } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteDoc } from 'firebase/firestore';
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Plus, Trash2, Upload, Save } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface Document {
  id: string;
  name: string;
  file?: File;
  fileUrl: string;
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

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
  const [skillsToDelete, setSkillsToDelete] = useState<string[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        
        const userDoc = await getDoc(doc(db, 'users', params.id as string));
        if (!userDoc.exists()) {
          toast({
            title: "Error",
            description: "User not found",
            variant: "destructive"
          });
          router.push('/search');
          return;
        }

        const userData = userDoc.data();
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          contractType: userData.contractType || '',
          company: userData.company || '',
          department: userData.department || '',
          expertise: userData.expertise || '',
          observations: userData.observations || ''
        });

        if (userData.generalExperience) {
          const date = userData.generalExperience.toDate();
          setGeneralExperience(date.toISOString().split('T')[0]);
        }

        // Fetch contracts
        const contractsQuery = query(
          collection(db, 'contracts'),
          where('userId', '==', params.id)
        );
        const contractsDocs = await getDocs(contractsQuery);
        const contractsData = contractsDocs.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate?.()?.toISOString?.().split('T')[0] || '',
            endDate: data.endDate?.toDate?.()?.toISOString?.().split('T')[0] || ''
          };
        }) as Contract[];
        setContracts(contractsData);

        // Fetch diplomas
        const diplomasQuery = query(
          collection(db, 'diplomas'),
          where('userId', '==', params.id)
        );
        const diplomasDocs = await getDocs(diplomasQuery);
        const diplomasData = diplomasDocs.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate?.()?.toISOString?.().split('T')[0] || ''
          };
        }) as Diploma[];
        setDiplomas(diplomasData);

        // Fetch skills
        const skillsQuery = query(
          collection(db, 'skills'),
          where('userId', '==', params.id)
        );
        const skillsDocs = await getDocs(skillsQuery);
        const skillsData = skillsDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Skill[];
        setSkills(skillsData);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router, toast]);

  const addContract = () => {
    const newContract: Contract = {
      id: `new-${Date.now()}`,
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

  const addDiploma = () => {
    const newDiploma: Diploma = {
      id: `new-${Date.now()}`,
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

  const addSkill = (type: 'Soft' | 'Hard') => {
    const newSkill: Skill = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    if (!skillId.startsWith('new-')) {
      setSkillsToDelete(prev => [...prev, skillId]);
    }
    setSkills(prevSkills => prevSkills.filter(skill => skill.id !== skillId));
  };
  

  const handleFileUpload = async (
    file: File,
    parentId: string,
    category: 'contracts' | 'diplomas'
  ): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${category}/${params.id}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const addDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId: string,
    category: 'contracts' | 'diplomas'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = await handleFileUpload(file, parentId, category);
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        fileUrl
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

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
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
  // Save all changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update user data
      await updateDoc(doc(db, 'users', params.id as string), {
        ...formData,
        generalExperience: generalExperience ? Timestamp.fromDate(new Date(generalExperience)) : null,
        updatedAt: Timestamp.now()
      });

      for (const skillId of skillsToDelete) {
        await deleteDoc(doc(db, 'skills', skillId));
      }
  
      for (const skill of skills) {
        const skillData = {
          name: skill.name,
          level: skill.level,
          type: skill.type,
          userId: params.id,
          updatedAt: Timestamp.now()
        };
  
        if (skill.id.startsWith('new-')) {
          await addDoc(collection(db, 'skills'), skillData);
        } else {
          await updateDoc(doc(db, 'skills', skill.id), skillData);
        }
      }

      // Update contracts
      for (const contract of contracts) {
        const contractData = {
          ...contract,
          userId: params.id,
          startDate: contract.startDate ? Timestamp.fromDate(new Date(contract.startDate)) : null,
          endDate: contract.endDate ? Timestamp.fromDate(new Date(contract.endDate)) : null,
          updatedAt: Timestamp.now()
        };

        if (contract.id.startsWith('new-')) {
          await addDoc(collection(db, 'contracts'), contractData);
        } else {
          await updateDoc(doc(db, 'contracts', contract.id), contractData);
        }
      }

      // Update diplomas
      for (const diploma of diplomas) {
        const diplomaData = {
          ...diploma,
          userId: params.id,
          date: diploma.date ? Timestamp.fromDate(new Date(diploma.date)) : null,
          updatedAt: Timestamp.now()
        };

        if (diploma.id.startsWith('new-')) {
          await addDoc(collection(db, 'diplomas'), diplomaData);
        } else {
          await updateDoc(doc(db, 'diplomas', diploma.id), diplomaData);
        }
      }

      // Update skills
      for (const skill of skills) {
        const skillData = {
          ...skill,
          userId: params.id,
          updatedAt: Timestamp.now()
        };

        if (skill.id.startsWith('new-')) {
          await addDoc(collection(db, 'skills'), skillData);
        } else {
          await updateDoc(doc(db, 'skills', skill.id), skillData);
        }
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
  
      router.push(`/profile/${params.id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error", 
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <div className="space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/profile/${params.id}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {saving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <form className="space-y-6">
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
                placeholder="Describe expertise..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Experience */}
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
                onChange={(e) => setGeneralExperience(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Contracts</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addContract}>
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

                <div className="mt-4 space-y-2">
                  <Label>Documents</Label>
                  {contract.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <span>{doc.name}</span>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDocument(doc.id, contract.id, 'contracts')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
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
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`contract-file-${contract.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload Document
                    </Button>
                  </div>
                </div>

                <Button 
                  type="button"
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

        {/* Diplomas */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Diplomas</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addDiploma}>
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

                <div className="mt-4 space-y-2">
                  <Label>Documents</Label>
                  {diploma.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <span>{doc.name}</span>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDocument(doc.id, diploma.id, 'diplomas')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
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
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`diploma-file-${diploma.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload Document
                    </Button>
                  </div>
                </div>

                <Button 
                  type="button" variant="destructive" 
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

        {/* Skills */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Soft Skills */}
          <Card>
  <CardHeader className="flex justify-between items-center">
    <CardTitle>Soft Skills</CardTitle>
    <Button type="button" variant="outline" size="sm" onClick={() => addSkill('Soft')}>
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
            type="button"
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

{/* Hard Skills Card - with strict type filtering */}
<Card>
  <CardHeader className="flex justify-between items-center">
    <CardTitle>Hard Skills</CardTitle>
    <Button type="button" variant="outline" size="sm" onClick={() => addSkill('Hard')}>
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
            type="button"
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

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/profile/${params.id}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {saving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
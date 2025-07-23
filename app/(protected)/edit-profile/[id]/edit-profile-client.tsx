'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, Trash2, Upload, Save, Loader2, Download } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface Document {
  id: string;
  name: string;
  file?: File;
  fileUrl?: string;
}

interface Contract {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  beneficiary: string | null;
  position: string | null;
  contractNumber: string | null;
  startDate: Date;
  endDate: Date | null;
  documents: Document[];
}

interface Diploma {
  id: string;
  name: string;
  issuer: string | null;
  issueDate: Date;
  expiryDate: Date | null;
  documents: Document[];
}

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  type: 'soft' | 'hard';
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

interface EditProfileClientProps {
  userId: string;
  initialUser: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    contractType: string | null;
    company: string | null;
    department: string | null;
    expertise: string | null;
    generalExperience: Date | null;
    observations: string | null;
    profileImageUrl: string | null;
    role: string;
  };
  initialContracts: Contract[];
  initialDiplomas: Diploma[];
  initialSkills: Skill[];
}

export default function EditProfileClient({
  userId,
  initialUser,
  initialContracts,
  initialDiplomas,
  initialSkills
}: EditProfileClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: initialUser.name,
    email: initialUser.email,
    phone: initialUser.phone || '',
    contractType: initialUser.contractType || '',
    company: initialUser.company || '',
    department: initialUser.department || '',
    expertise: initialUser.expertise || '',
    observations: initialUser.observations || ''
  })

  const [generalExperience, setGeneralExperience] = useState(() => {
    if (initialUser.generalExperience) {
      const date = new Date(initialUser.generalExperience)
      return date.toISOString().split('T')[0]
    }
    return ''
  })

  const [contracts, setContracts] = useState<Contract[]>(initialContracts)
  const [diplomas, setDiplomas] = useState<Diploma[]>(initialDiplomas)
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [skillsToDelete, setSkillsToDelete] = useState<string[]>([])
  const [contractsToDelete, setContractsToDelete] = useState<string[]>([])
  const [diplomasToDelete, setDiplomasToDelete] = useState<string[]>([])
  const [experienceByPosition, setExperienceByPosition] = useState<{[key: string]: number}>({})

  // Experience calculation
  useEffect(() => {
    calculateExperience();
  }, [contracts]);

  const calculateExperience = () => {
    const expByPosition: {[key: string]: number} = {};
    
    contracts.forEach(contract => {
      if (contract.startDate && contract.position) {
        const start = new Date(contract.startDate);
        const end = contract.endDate ? new Date(contract.endDate) : new Date();
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
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      location: '',
      beneficiary: '',
      position: '',
      contractNumber: '',
      startDate: new Date(),
      endDate: null,
      documents: []
    };
    setContracts([...contracts, newContract]);
  };

  const updateContract = (contractId: string, field: keyof Omit<Contract, 'id' | 'documents'>, value: string) => {
    setContracts(prevContracts =>
      prevContracts.map(contract =>
        contract.id === contractId
          ? { ...contract, [field]: field.includes('Date') ? (value ? new Date(value) : null) : value }
          : contract
      )
    );
  };

  const removeContract = (contractId: string) => {
    if (!contractId.startsWith('new-')) {
      setContractsToDelete(prev => [...prev, contractId]);
    }
    setContracts(prevContracts => prevContracts.filter(contract => contract.id !== contractId));
  };

  // Diploma management
  const addDiploma = () => {
    const newDiploma: Diploma = {
      id: `new-${Date.now()}`,
      name: '',
      issuer: '',
      issueDate: new Date(),
      expiryDate: null,
      documents: []
    };
    setDiplomas([...diplomas, newDiploma]);
  };

  const updateDiploma = (diplomaId: string, field: keyof Omit<Diploma, 'id' | 'documents'>, value: string) => {
    setDiplomas(prevDiplomas =>
      prevDiplomas.map(diploma =>
        diploma.id === diplomaId
          ? { ...diploma, [field]: field.includes('Date') ? (value ? new Date(value) : null) : value }
          : diploma
      )
    );
  };

  const removeDiploma = (diplomaId: string) => {
    if (!diplomaId.startsWith('new-')) {
      setDiplomasToDelete(prev => [...prev, diplomaId]);
    }
    setDiplomas(prevDiplomas => prevDiplomas.filter(diploma => diploma.id !== diplomaId));
  };

  // Skills management
  const addSkill = (type: 'soft' | 'hard') => {
    const newSkill: Skill = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      level: 'beginner',
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

  // Document management
  const addDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
    parentId: string,
    category: 'contracts' | 'diplomas'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDocument: Document = {
      id: `new-${Date.now()}`,
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

  // Save all changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      
      // User data
      formDataToSend.append('userData', JSON.stringify({
        ...formData,
        general_experience: generalExperience ? new Date(generalExperience) : null,
      }));

      // Items to delete
      formDataToSend.append('deleteData', JSON.stringify({
        skills: skillsToDelete,
        contracts: contractsToDelete,
        diplomas: diplomasToDelete
      }));

      // Contracts data
      const contractsData = contracts.map(contract => ({
        id: contract.id.startsWith('new-') ? null : contract.id,
        name: contract.name,
        description: contract.description,
        location: contract.location,
        beneficiary: contract.beneficiary,
        position: contract.position,
        contract_number: contract.contractNumber,
        start_date: contract.startDate,
        end_date: contract.endDate,
      }));
      formDataToSend.append('contracts', JSON.stringify(contractsData));

      // Diplomas data
      const diplomasData = diplomas.map(diploma => ({
        id: diploma.id.startsWith('new-') ? null : diploma.id,
        name: diploma.name,
        issuer: diploma.issuer,
        issue_date: diploma.issueDate,
        expiry_date: diploma.expiryDate,
      }));
      formDataToSend.append('diplomas', JSON.stringify(diplomasData));

      // Skills data
      const skillsData = skills.map(skill => ({
        id: skill.id.startsWith('new-') ? null : skill.id,
        name: skill.name,
        level: skill.level,
        type: skill.type
      }));
      formDataToSend.append('skills', JSON.stringify(skillsData));

      // Add document files
      contracts.forEach((contract, contractIndex) => {
        contract.documents.forEach((doc, docIndex) => {
          if (doc.file) {
            formDataToSend.append(`contract_${contractIndex}_doc_${docIndex}`, doc.file);
          }
        });
      });

      diplomas.forEach((diploma, diplomaIndex) => {
        diploma.documents.forEach((doc, docIndex) => {
          if (doc.file) {
            formDataToSend.append(`diploma_${diplomaIndex}_doc_${docIndex}`, doc.file);
          }
        });
      });

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      router.push(`/profile/${userId}`);
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

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <div className="space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/profile/${userId}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Contracts</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addContract}>
                <Plus className="h-4 w-4 mr-2" /> Add Contract
              </Button>
            </div>
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
                    <Label>Contract Number</Label>
                    <Input
                      value={contract.contractNumber || ''}
                      onChange={(e) => updateContract(contract.id, 'contractNumber', e.target.value)}
                      placeholder="Contract number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={contract.description || ''}
                      onChange={(e) => updateContract(contract.id, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={contract.location || ''}
                      onChange={(e) => updateContract(contract.id, 'location', e.target.value)}
                      placeholder="Location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Beneficiary</Label>
                    <Input
                      value={contract.beneficiary || ''}
                      onChange={(e) => updateContract(contract.id, 'beneficiary', e.target.value)}
                      placeholder="Beneficiary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={contract.position || ''}
                      onChange={(e) => updateContract(contract.id, 'position', e.target.value)}
                      placeholder="Position"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formatDateForInput(contract.startDate)}
                      onChange={(e) => updateContract(contract.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formatDateForInput(contract.endDate)}
                      onChange={(e) => updateContract(contract.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Contract Documents */}
                <div className="mt-4 space-y-2">
                  <Label>Documents</Label>
                  {contract.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{doc.name}</span>
                      <div className="flex gap-2">
                        {doc.fileUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/api/documents/${doc.fileUrl}`, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(doc.id, contract.id, 'contracts')}
                        >
                          <Trash2 className="h-4 w-4" />
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
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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

        {/* Experience Summary */}
        {Object.keys(experienceByPosition).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Experience Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(experienceByPosition).map(([position, years]) => (
                <div key={position} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="font-medium">{position}</span>
                  <span className="text-muted-foreground">{years.toFixed(1)} years</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Diplomas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Diplomas & Certifications</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addDiploma}>
                <Plus className="h-4 w-4 mr-2" /> Add Diploma
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {diplomas.map((diploma) => (
              <div key={diploma.id} className="p-4 border rounded space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={diploma.issuer || ''}
                      onChange={(e) => updateDiploma(diploma.id, 'issuer', e.target.value)}
                      placeholder="Issuer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={formatDateForInput(diploma.issueDate)}
                      onChange={(e) => updateDiploma(diploma.id, 'issueDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date (optional)</Label>
                    <Input
                      type="date"
                      value={formatDateForInput(diploma.expiryDate)}
                      onChange={(e) => updateDiploma(diploma.id, 'expiryDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Diploma Documents */}
                <div className="mt-4 space-y-2">
                  <Label>Documents</Label>
                  {diploma.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{doc.name}</span>
                      <div className="flex gap-2">
                        {doc.fileUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/api/documents/${doc.fileUrl}`, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(doc.id, diploma.id, 'diplomas')}
                        >
                          <Trash2 className="h-4 w-4" />
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
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                  type="button"
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

        {/* Skills */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Soft Skills */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Soft Skills</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill('soft')}>
                  <Plus className="h-4 w-4 mr-2" /> Add Skill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {skills
                  .filter(skill => skill.type === 'soft')
                  .map((skill) => (
                  <div key={skill.id} className="p-4 border rounded space-y-4">
                    <div className="grid grid-cols-1 gap-4">
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
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeSkill(skill.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hard Skills */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Hard Skills</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill('hard')}>
                  <Plus className="h-4 w-4 mr-2" /> Add Skill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {skills
                  .filter(skill => skill.type === 'hard')
                  .map((skill) => (
                  <div key={skill.id} className="p-4 border rounded space-y-4">
                    <div className="grid grid-cols-1 gap-4">
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
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeSkill(skill.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                ))}
              </div>
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
              placeholder="Add observations..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
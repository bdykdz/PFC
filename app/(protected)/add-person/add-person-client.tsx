'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
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
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface Document {
  id: string;
  name: string;
  file: File;
}

interface Contract {
  id: string;
  name: string;
  description: string;
  location: string;
  beneficiary: string;
  position: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  documents: Document[];
}

interface Diploma {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
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

export default function AddPersonClient() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
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
  const [generalDocuments, setGeneralDocuments] = useState<Document[]>([])
  
  // Refs for file inputs
  const contractFileRefs = useRef<{[key: string]: HTMLInputElement}>({})
  const diplomaFileRefs = useRef<{[key: string]: HTMLInputElement}>({})
  const generalDocumentRef = useRef<HTMLInputElement>(null)

  // Experience calculation
  useEffect(() => {
    calculateExperience();
  }, [contracts]);

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
      contractNumber: '',
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
      issueDate: '',
      expiryDate: '',
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
  const addSkill = (type: 'soft' | 'hard') => {
    const newSkill: Skill = {
      id: Date.now().toString(),
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

  // General documents management
  const addGeneralDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDocument: Document = {
      id: `new-${Date.now()}`,
      name: file.name,
      file: file
    };

    setGeneralDocuments(prev => [...prev, newDocument]);
    
    // Reset the input
    if (generalDocumentRef.current) {
      generalDocumentRef.current.value = '';
    }
  };

  const removeGeneralDocument = (docId: string) => {
    setGeneralDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({
        title: t('common.error'),
        description: t('form.pleaseAcceptTerms'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare form data
      const formDataToSend = new FormData();
      
      // Employee data
      formDataToSend.append('employeeData', JSON.stringify({
        ...formData,
        general_experience: generalExperience ? new Date(generalExperience) : new Date(),
      }));

      // Contracts data
      const contractsData = contracts.map(contract => ({
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
        name: diploma.name,
        issuer: diploma.issuer,
        issue_date: diploma.issueDate,
        expiry_date: diploma.expiryDate || null,
      }));
      formDataToSend.append('diplomas', JSON.stringify(diplomasData));

      // Skills data
      formDataToSend.append('skills', JSON.stringify(skills));

      // General documents data
      const generalDocsData = generalDocuments.map(doc => ({
        name: doc.name
      }));
      formDataToSend.append('generalDocuments', JSON.stringify(generalDocsData));

      // Add document files
      contracts.forEach((contract, contractIndex) => {
        contract.documents.forEach((doc, docIndex) => {
          formDataToSend.append(`contract_${contractIndex}_doc_${docIndex}`, doc.file);
        });
      });

      diplomas.forEach((diploma, diplomaIndex) => {
        diploma.documents.forEach((doc, docIndex) => {
          formDataToSend.append(`diploma_${diplomaIndex}_doc_${docIndex}`, doc.file);
        });
      });

      // Add general document files
      generalDocuments.forEach((doc, docIndex) => {
        formDataToSend.append(`general_doc_${docIndex}`, doc.file);
      });

      const response = await fetch('/api/employees', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }

      const result = await response.json();

      toast({
        title: t('common.success'),
        description: t('form.employeeAddedSuccess'),
      });

      router.push(`/profile/${result.employeeId}`);
    } catch (error: any) {
      console.error('Error adding person:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('form.failedToAddPerson'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('addPerson.title')}</h1>
        <LanguageSwitcher />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('addPerson.personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('form.fullName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('form.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('form.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-type">{t('profile.contractType')}</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => setFormData({...formData, contractType: value})}
                >
                  <SelectTrigger id="contract-type">
                    <SelectValue placeholder={t('form.selectContractType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIM">CIM</SelectItem>
                    <SelectItem value="PFA">PFA</SelectItem>
                    <SelectItem value="SRL">SRL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t('addPerson.company')}</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">{t('addPerson.department')}</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertise">{t('addPerson.expertise')}</Label>
              <Textarea
                id="expertise"
                value={formData.expertise}
                onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                placeholder={t('addPerson.expertisePlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* General Experience */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.experience')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="general-experience">{t('addPerson.generalExperience')} *</Label>
              <Input
                id="general-experience"
                type="date"
                value={generalExperience}
                onChange={(e) => setGeneralExperience(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Contracts Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('addPerson.contracts')}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addContract}>
                <Plus className="h-4 w-4 mr-2" /> {t('addPerson.addContract')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-4 border rounded space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('form.contractName')}</Label>
                    <Input
                      value={contract.name}
                      onChange={(e) => updateContract(contract.id, 'name', e.target.value)}
                      placeholder={t('form.contractNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.contractNumber')}</Label>
                    <Input
                      value={contract.contractNumber}
                      onChange={(e) => updateContract(contract.id, 'contractNumber', e.target.value)}
                      placeholder={t('form.contractNumberPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.description')}</Label>
                    <Input
                      value={contract.description}
                      onChange={(e) => updateContract(contract.id, 'description', e.target.value)}
                      placeholder={t('common.description')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.location')}</Label>
                    <Input
                      value={contract.location}
                      onChange={(e) => updateContract(contract.id, 'location', e.target.value)}
                      placeholder={t('form.location')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.beneficiary')}</Label>
                    <Input
                      value={contract.beneficiary}
                      onChange={(e) => updateContract(contract.id, 'beneficiary', e.target.value)}
                      placeholder={t('form.beneficiary')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.position')}</Label>
                    <Input
                      value={contract.position}
                      onChange={(e) => updateContract(contract.id, 'position', e.target.value)}
                      placeholder={t('form.position')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.startDate')}</Label>
                    <Input
                      type="date"
                      value={contract.startDate}
                      onChange={(e) => updateContract(contract.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.endDate')}</Label>
                    <Input
                      type="date"
                      value={contract.endDate}
                      onChange={(e) => updateContract(contract.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Contract Documents */}
                <div className="mt-4 space-y-2">
                  <Label>{t('addPerson.documents')}</Label>
                  {contract.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{doc.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id, contract.id, 'contracts')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id={`contract-file-${contract.id}`}
                      className="hidden"
                      onChange={(e) => addDocument(e, contract.id, 'contracts')}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      ref={(el) => {
                        if (el) contractFileRefs.current[contract.id] = el;
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => contractFileRefs.current[contract.id]?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> {t('form.uploadDocument')}
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
                  <Trash2 className="h-4 w-4 mr-2" /> {t('form.deleteContract')}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Experience Summary */}
        {Object.keys(experienceByPosition).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('addPerson.experienceSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(experienceByPosition).map(([position, years]) => (
                <div key={position} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="font-medium">{position}</span>
                  <span className="text-muted-foreground">{years.toFixed(1)} {t('common.years')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Diplomas Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('addPerson.diplomas')}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addDiploma}>
                <Plus className="h-4 w-4 mr-2" /> {t('addPerson.addDiploma')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {diplomas.map((diploma) => (
              <div key={diploma.id} className="p-4 border rounded space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('form.diplomaName')}</Label>
                    <Input
                      value={diploma.name}
                      onChange={(e) => updateDiploma(diploma.id, 'name', e.target.value)}
                      placeholder={t('form.diplomaNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.issuer')}</Label>
                    <Input
                      value={diploma.issuer}
                      onChange={(e) => updateDiploma(diploma.id, 'issuer', e.target.value)}
                      placeholder={t('form.issuerPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.issueDate')}</Label>
                    <Input
                      type="date"
                      value={diploma.issueDate}
                      onChange={(e) => updateDiploma(diploma.id, 'issueDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.expiryDate')} ({t('common.optional')})</Label>
                    <Input
                      type="date"
                      value={diploma.expiryDate || ''}
                      onChange={(e) => updateDiploma(diploma.id, 'expiryDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Diploma Documents */}
                <div className="mt-4 space-y-2">
                  <Label>{t('addPerson.documents')}</Label>
                  {diploma.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{doc.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id, diploma.id, 'diplomas')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id={`diploma-file-${diploma.id}`}
                      className="hidden"
                      onChange={(e) => addDocument(e, diploma.id, 'diplomas')}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      ref={(el) => {
                        if (el) diplomaFileRefs.current[diploma.id] = el;
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => diplomaFileRefs.current[diploma.id]?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> {t('form.uploadDocument')}
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
                  <Trash2 className="h-4 w-4 mr-2" /> {t('form.deleteDiploma')}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Soft Skills */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('addPerson.softSkills')}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill('soft')}>
                  <Plus className="h-4 w-4 mr-2" /> {t('form.addSkill')}
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
                        <Label>{t('form.skill')}</Label>
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                          placeholder={t('form.skillNamePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('form.level')}</Label>
                        <Select
                          value={skill.level}
                          onValueChange={(value) => updateSkill(skill.id, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.selectLevel')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">{t('skills.beginner')}</SelectItem>
                            <SelectItem value="intermediate">{t('skills.intermediate')}</SelectItem>
                            <SelectItem value="expert">{t('skills.expert')}</SelectItem>
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
                      <Trash2 className="h-4 w-4 mr-2" /> {t('common.delete')}
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
                <CardTitle>{t('addPerson.hardSkills')}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill('hard')}>
                  <Plus className="h-4 w-4 mr-2" /> {t('form.addSkill')}
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
                        <Label>{t('form.skill')}</Label>
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                          placeholder={t('form.skillNamePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('form.level')}</Label>
                        <Select
                          value={skill.level}
                          onValueChange={(value) => updateSkill(skill.id, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.selectLevel')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">{t('skills.beginner')}</SelectItem>
                            <SelectItem value="intermediate">{t('skills.intermediate')}</SelectItem>
                            <SelectItem value="expert">{t('skills.expert')}</SelectItem>
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
                      <Trash2 className="h-4 w-4 mr-2" /> {t('common.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* General Documents */}
        <Card>
          <CardHeader>
            <CardTitle>{t('addPerson.documents')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('addPerson.uploadRelatedDocuments')}</Label>
              {generalDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{doc.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGeneralDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  ref={generalDocumentRef}
                  className="hidden"
                  onChange={addGeneralDocument}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generalDocumentRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        <Card>
          <CardHeader>
            <CardTitle>{t('addPerson.observations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observations}
              onChange={(e) => setFormData({...formData, observations: e.target.value})}
              placeholder={t('addPerson.observationsPlaceholder')}
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
            <Label htmlFor="terms">{t('form.acceptTerms')}</Label>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !termsAccepted}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('form.addingPerson')}...
              </>
            ) : (
              t('form.addPerson')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
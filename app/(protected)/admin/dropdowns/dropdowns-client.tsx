'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Building,
  Briefcase,
  MapPin,
  Users,
  Award,
  GraduationCap,
} from 'lucide-react'

interface DropdownData {
  departments: string[]
  companies: string[]
  positions: string[]
  locations: string[]
  beneficiaries: string[]
  skill_names: string[]
  diploma_names: string[]
  diploma_issuers: string[]
}

const DROPDOWN_TYPES = [
  { key: 'departments', label: 'departments', icon: Building },
  { key: 'companies', label: 'companies', icon: Building },
  { key: 'positions', label: 'positions', icon: Briefcase },
  { key: 'locations', label: 'locations', icon: MapPin },
  { key: 'beneficiaries', label: 'beneficiaries', icon: Users },
  { key: 'skill_names', label: 'skillNames', icon: Award },
  { key: 'diploma_names', label: 'diplomaNames', icon: GraduationCap },
  { key: 'diploma_issuers', label: 'diplomaIssuers', icon: Building },
]

export function DropdownsClient() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    departments: [],
    companies: [],
    positions: [],
    locations: [],
    beneficiaries: [],
    skill_names: [],
    diploma_names: [],
    diploma_issuers: [],
  })
  
  const [activeTab, setActiveTab] = useState('departments')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [editingItem, setEditingItem] = useState<{ type: string; oldValue: string; newValue: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: string; value: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDropdownData()
  }, [])

  const loadDropdownData = async () => {
    try {
      const response = await fetch('/api/admin/dropdowns')
      if (response.ok) {
        const data = await response.json()
        setDropdownData(data)
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error)
      toast({
        title: t('common.error'),
        description: 'Failed to load dropdown data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newValue.trim()) return

    try {
      const response = await fetch('/api/admin/dropdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          action: 'add',
          value: newValue.trim()
        })
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('admin.itemAdded')
        })
        setNewValue('')
        setShowAddDialog(false)
        loadDropdownData()
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to add item',
        variant: 'destructive'
      })
    }
  }

  const handleEditItem = async () => {
    if (!editingItem || !editingItem.newValue.trim()) return

    try {
      const response = await fetch('/api/admin/dropdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editingItem.type,
          action: 'update',
          oldValue: editingItem.oldValue,
          value: editingItem.newValue.trim()
        })
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('admin.itemUpdated')
        })
        setEditingItem(null)
        setShowEditDialog(false)
        loadDropdownData()
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to update item',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return

    try {
      const response = await fetch('/api/admin/dropdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: deletingItem.type,
          action: 'delete',
          value: deletingItem.value
        })
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('admin.itemDeleted')
        })
        setDeletingItem(null)
        setShowDeleteDialog(false)
        loadDropdownData()
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to delete item',
        variant: 'destructive'
      })
    }
  }

  const openEditDialog = (type: string, value: string) => {
    setEditingItem({ type, oldValue: value, newValue: value })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (type: string, value: string) => {
    setDeletingItem({ type, value })
    setShowDeleteDialog(true)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          {t('admin.manageDropdowns')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('admin.manageDropdownsDescription')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
          {DROPDOWN_TYPES.map(type => (
            <TabsTrigger key={type.key} value={type.key} className="flex items-center gap-1">
              <type.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{t(`admin.${type.label}`)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {DROPDOWN_TYPES.map(type => (
          <TabsContent key={type.key} value={type.key}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <type.icon className="h-5 w-5" />
                    {t(`admin.${type.label}`)}
                    <Badge variant="secondary">
                      {dropdownData[type.key as keyof DropdownData].length}
                    </Badge>
                  </CardTitle>
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.addNew')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : dropdownData[type.key as keyof DropdownData].length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('admin.noItemsFound')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dropdownData[type.key as keyof DropdownData].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <span className="font-medium">{item}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(type.key, item)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(type.key, item)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.addNew')} {t(`admin.${DROPDOWN_TYPES.find(t => t.key === activeTab)?.label || ''}`)}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('admin.enterNewValue')}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddItem} disabled={!newValue.trim()}>
              {t('admin.addNew')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editItem')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('admin.enterNewValue')}
              value={editingItem?.newValue || ''}
              onChange={(e) => editingItem && setEditingItem({...editingItem, newValue: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleEditItem()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditItem} disabled={!editingItem?.newValue?.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.deleteItem')}</DialogTitle>
            <DialogDescription>
              {t('admin.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{deletingItem?.value}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
// Card bileşenini kullanmıyoruz
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// Props tanımı ekle
interface SettingsViewProps {
  onClose: () => void;
  onNavigate?: (view: string) => void;
  financialData?: any[];
  toursData?: any[];
  customersData?: any[];
  onUpdateData?: (type: string, data: any[]) => void;
}

export function SettingsView({ 
  onClose, 
  onNavigate = () => {},
  financialData = [],
  toursData = [],
  customersData = [],
  onUpdateData = () => {}
}: SettingsViewProps) {
  const { toast } = useToast()

  return (
    <>
      <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-row items-center justify-between p-6">
          <h2 className="text-2xl font-semibold leading-none tracking-tight text-[#00a1c6]">Ayarlar</h2>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
        <div className="p-6 pt-0">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-6">
              <TabsTrigger value="company">Şirket</TabsTrigger>
              <TabsTrigger value="providers">Sağlayıcılar</TabsTrigger>
              <TabsTrigger value="expense-types">Gider Türleri</TabsTrigger>
              <TabsTrigger value="activities">Aktiviteler</TabsTrigger>
              <TabsTrigger value="destinations">Destinasyonlar</TabsTrigger>
              <TabsTrigger value="tours">Tur Şablonları</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4">
              <div className="text-sm">Şirket bilgileri buraya gelecek</div>
            </TabsContent>
            <TabsContent value="providers" className="space-y-4">
              <div className="text-sm">Sağlayıcılar buraya gelecek</div>
            </TabsContent>
            <TabsContent value="expense-types" className="space-y-4">
              <div className="text-sm">Gider türleri buraya gelecek</div>
            </TabsContent>
            <TabsContent value="activities" className="space-y-4">
              <div className="text-sm">Aktiviteler buraya gelecek</div>
            </TabsContent>
            <TabsContent value="destinations" className="space-y-4">
              <div className="text-sm">Destinasyonlar buraya gelecek</div>
            </TabsContent>
            <TabsContent value="tours" className="space-y-4">
              <div className="text-sm">Tur şablonları buraya gelecek</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}


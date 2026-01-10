import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { School, Lock, AlertCircle, Loader2, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ConnectPronoteModal({ open, onOpenChange, onConnect }) {
  const [activeTab, setActiveTab] = useState('pronote');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
  const [pronoteData, setPronoteData] = useState({
    username: '',
    password: '',
    url: ''
  });

  const [edData, setEdData] = useState({
    username: '',
    password: ''
  });

  const handleConnect = async (service) => {
    setIsConnecting(true);
    setError('');

    try {
      const credentials = service === 'pronote' 
        ? { 
            pronote_username: pronoteData.username,
            pronote_password: pronoteData.password,
            pronote_url: pronoteData.url,
            auto_sync_enabled: true
          }
        : {
            ecoledirecte_username: edData.username,
            ecoledirecte_password: edData.password,
            auto_sync_enabled: true
          };

      await onConnect(credentials);
      onOpenChange(false);
    } catch (err) {
      setError(`Erreur de connexion. Vérifie tes identifiants.`);
    }

    setIsConnecting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <School className="w-4 h-4 text-white" />
            </div>
            Connecter ton compte
          </DialogTitle>
          <DialogDescription>
            Synchronise automatiquement tes devoirs depuis Pronote ou École Directe
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            Tes identifiants sont chiffrés et sécurisés.{' '}
            <Link to={createPageUrl('Privacy')} className="underline font-medium">
              Voir la charte de protection des données
            </Link>
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pronote">Pronote</TabsTrigger>
            <TabsTrigger value="ecoledirecte">École Directe</TabsTrigger>
          </TabsList>

          <TabsContent value="pronote" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pronote-url">URL de ton établissement</Label>
              <Input
                id="pronote-url"
                placeholder="https://0000000a.index-education.net/pronote/"
                value={pronoteData.url}
                onChange={(e) => setPronoteData({ ...pronoteData, url: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Tu peux la trouver dans la barre d'adresse quand tu te connectes à Pronote
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronote-username">Identifiant</Label>
              <Input
                id="pronote-username"
                placeholder="Ton identifiant Pronote"
                value={pronoteData.username}
                onChange={(e) => setPronoteData({ ...pronoteData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronote-password">Mot de passe</Label>
              <Input
                id="pronote-password"
                type="password"
                placeholder="••••••••"
                value={pronoteData.password}
                onChange={(e) => setPronoteData({ ...pronoteData, password: e.target.value })}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => handleConnect('pronote')}
              disabled={!pronoteData.username || !pronoteData.password || !pronoteData.url || isConnecting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              ⚠️ Fonctionnalité en développement - Nécessite l'activation des backend functions
            </p>
          </TabsContent>

          <TabsContent value="ecoledirecte" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ed-username">Identifiant</Label>
              <Input
                id="ed-username"
                placeholder="Ton identifiant École Directe"
                value={edData.username}
                onChange={(e) => setEdData({ ...edData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ed-password">Mot de passe</Label>
              <Input
                id="ed-password"
                type="password"
                placeholder="••••••••"
                value={edData.password}
                onChange={(e) => setEdData({ ...edData, password: e.target.value })}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => handleConnect('ecoledirecte')}
              disabled={!edData.username || !edData.password || isConnecting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              ⚠️ Fonctionnalité en développement - Nécessite l'activation des backend functions
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
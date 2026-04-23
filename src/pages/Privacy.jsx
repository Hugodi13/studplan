import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useI18n } from '@/lib/I18nContext';

export default function Privacy() {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {isEn ? 'Back' : 'Retour'}
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {isEn ? 'Data Protection Policy' : 'Charte de Protection des Données'}
          </h1>
          <p className="text-lg text-slate-600">
            {isEn ? 'We take your data security very seriously' : 'Nous prenons la sécurité de tes données très au sérieux'}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {isEn ? 'Last update: January 8, 2026' : 'Dernière mise à jour : 8 janvier 2026'}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Database className="w-5 h-5 text-violet-600" />
                </div>
                {isEn ? 'Collected data' : 'Données collectées'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p>{isEn ? 'StudPlan only collects data required for app features:' : 'StudPlan collecte uniquement les données nécessaires à son fonctionnement :'}</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>{isEn ? 'Profile information' : 'Informations de profil'}</strong> : {isEn ? 'School level, specialties (to personalize experience)' : "Niveau scolaire, spécialités (pour personnaliser l'expérience)"}</li>
                <li><strong>{isEn ? 'Tasks and homework' : 'Tâches et devoirs'}</strong> : {isEn ? 'Titles, subjects, dates, descriptions you enter' : 'Titres, matières, dates, descriptions que tu saisis'}</li>
                <li><strong>Planning de révisions</strong> : Sessions générées par l'IA</li>
                <li><strong>{isEn ? 'Preferences' : 'Préférences'}</strong> : {isEn ? 'Study hours, session duration' : 'Heures de révision, durée des sessions'}</li>
                <li><strong>{isEn ? 'Photos (optional)' : 'Photos (optionnel)'}</strong> : {isEn ? 'Homework images you choose to upload' : "Images de devoirs que tu choisis d'uploader"}</li>
                <li><strong>{isEn ? 'Pronote/Ecole Directe credentials (optional)' : 'Identifiants Pronote/École Directe (optionnel)'}</strong> : {isEn ? 'Only if you enable auto-sync' : 'Si tu actives la synchronisation automatique'}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                {isEn ? 'Security and encryption' : 'Sécurité et chiffrement'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Chiffrement de bout en bout</strong> : Toutes tes données sont chiffrées en transit (HTTPS/TLS)</li>
                <li><strong>Identifiants sécurisés</strong> : Les mots de passe Pronote/École Directe sont chiffrés avant stockage</li>
                <li><strong>Stockage sécurisé</strong> : Les données sont hébergées sur des serveurs certifiés et sécurisés</li>
                <li><strong>Accès personnel</strong> : Seul toi as accès à tes données via ton compte</li>
                <li><strong>Pas de revente</strong> : Nous ne vendons JAMAIS tes données à des tiers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                {isEn ? 'How data is used' : 'Utilisation des données'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p>Tes données sont utilisées exclusivement pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Générer ton planning de révisions personnalisé</li>
                <li>Te rappeler tes tâches et deadlines</li>
                <li>Synchroniser tes devoirs depuis Pronote/École Directe (si activé)</li>
                <li>Analyser tes photos de devoirs avec l'IA (traitement temporaire, images non stockées)</li>
                <li>Améliorer l'algorithme de planification</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                </div>
                {isEn ? 'Your rights' : 'Tes droits'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p>Conformément au RGPD, tu disposes des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Droit d'accès</strong> : Consulter toutes tes données à tout moment</li>
                <li><strong>Droit de rectification</strong> : Modifier ou corriger tes informations</li>
                <li><strong>Droit à l'effacement</strong> : Supprimer ton compte et toutes tes données</li>
                <li><strong>Droit à la portabilité</strong> : Exporter tes données dans un format lisible</li>
                <li><strong>Droit d'opposition</strong> : Refuser le traitement de certaines données</li>
              </ul>
              <p className="mt-4 text-sm">
                Pour exercer ces droits, tu peux nous contacter à l'adresse : <strong>hugodi777@outlook.fr</strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                {isEn ? 'Data retention' : 'Conservation des données'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Tâches et planning</strong> : Conservés tant que ton compte est actif</li>
                <li><strong>Photos uploadées</strong> : Traitées immédiatement et supprimées après analyse (non stockées)</li>
                <li><strong>Identifiants synchronisation</strong> : Conservés tant que la fonctionnalité est active</li>
                <li><strong>Compte inactif</strong> : Suppression automatique après 24 mois d'inactivité</li>
                <li><strong>Suppression volontaire</strong> : Effacement complet sous 30 jours après demande</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
            <CardContent className="py-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                {isEn ? 'Our commitment' : 'Notre engagement'}
              </h3>
              <p className="text-slate-700 leading-relaxed">
                StudPlan s'engage à protéger ta vie privée et la sécurité de tes données. 
                Nous respectons scrupuleusement le RGPD et les lois françaises sur la protection des données. 
                Tes données personnelles restent <strong>TA propriété</strong> et ne seront jamais utilisées 
                à des fins commerciales ou publicitaires.
              </p>
            </CardContent>
          </Card>

          <div className="text-center pt-8">
            <p className="text-sm text-slate-500 mb-4">
              {isEn ? 'Questions about our privacy policy?' : 'Des questions sur notre politique de confidentialité ?'}
            </p>
            <p className="text-sm text-slate-600">
              Contact : <a href="mailto:hugodi777@outlook.fr" className="text-violet-600 hover:text-violet-700 font-medium">
                hugodi777@outlook.fr
              </a>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} StudPlan - {isEn ? 'All rights reserved' : 'Tous droits réservés'}
              <br />
              {isEn ? 'App created by ' : 'Application créée par '}<span className="font-semibold text-slate-700">Hugo Di Chiara</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
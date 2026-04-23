import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Zap, Shield, TrendingUp, ExternalLink } from "lucide-react";
import { useI18n } from '@/lib/I18nContext';
import { getPremiumFeatureLists } from '@/lib/i18n';

const PAYPAL_SUBSCRIBE_DEFAULT =
  'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-1YC555706H685240MNHUNJFQ'
const PAYPAL_HREF = import.meta.env.VITE_PAYPAL_SUBSCRIBE_URL || PAYPAL_SUBSCRIBE_DEFAULT

export default function PremiumModal({ open, onOpenChange, onTestPremium }) {
  const { t, locale } = useI18n();
  const features = useMemo(() => getPremiumFeatureLists(locale), [locale]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Crown className="w-5 h-5 text-white" />
            </div>
            {t('premiumModalTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('premiumModalSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 py-6">
          <Card className="p-6 border-2 border-slate-200">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-700">{t('premiumPlanFree')}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">{t('premiumPriceFree')}</span>
                <span className="text-slate-500">{t('premiumPerMonth')}</span>
              </div>
            </div>
            <ul className="space-y-3">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
                {t('premiumPopular')}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600" />
                {t('premiumPlanPaid')}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-amber-900">{t('premiumPricePaid')}</span>
                <span className="text-amber-700">{t('premiumPerMonth')}</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">{t('premiumCancelAnytime')}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {features.premium.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-amber-900 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              {PAYPAL_HREF ? (
                <Button
                  type="button"
                  asChild
                  className="w-full h-11 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold"
                >
                  <a href={PAYPAL_HREF} target="_blank" rel="noopener noreferrer">
                    <span className="inline-flex items-center justify-center w-full">
                      {t('premiumSubscribePaypal')}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </span>
                  </a>
                </Button>
              ) : (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-2">
                  {t('premiumPaypalMissing')}
                </p>
              )}
              {import.meta.env.DEV && typeof onTestPremium === 'function' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-xs"
                  onClick={onTestPremium}
                >
                  {t('premiumTestLocal')}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-violet-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-600" />
            </div>
            <p className="text-xs font-medium text-slate-700">{t('premiumTrustSecure')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-slate-700">{t('premiumTrustGrades')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-slate-700">{t('premiumTrustFlexible')}</p>
          </div>
        </div>

        <p className="text-xs text-center text-slate-500 mt-4">
          {t('premiumFooterNote')}
        </p>
      </DialogContent>
    </Dialog>
  );
}

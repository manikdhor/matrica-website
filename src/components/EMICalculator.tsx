'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BarChart3 } from 'lucide-react'
import { useSiteSettings } from '@/lib/use-site-settings'
import { useT } from '@/lib/use-ui-strings'

function formatBDT(value: number): string {
  return '৳ ' + Math.round(value).toLocaleString('en-IN')
}

export default function EMICalculator() {
  const t = useT()
  const settings = useSiteSettings()
  const [loanAmount, setLoanAmount] = useState<string>('5000000')
  const [interestRate, setInterestRate] = useState<string>('9.5')
  const [tenure, setTenure] = useState<string>('5')

  // Seed rate/tenure defaults from admin settings until the visitor edits them.
  const userEdited = useRef(false)
  useEffect(() => {
    if (userEdited.current) return
    setInterestRate(settings.emiDefaultRate ?? '9.5')
    setTenure(settings.emiDefaultTenure ?? '5')
  }, [settings.emiDefaultRate, settings.emiDefaultTenure])

  const [emi, setEmi] = useState<number | null>(null)
  const [totalInterest, setTotalInterest] = useState<number | null>(null)
  const [totalPayment, setTotalPayment] = useState<number | null>(null)
  const [calculated, setCalculated] = useState(false)

  const handleCalculate = () => {
    const P = parseFloat(loanAmount)
    const annualRate = parseFloat(interestRate)
    const years = parseFloat(tenure)

    if (isNaN(P) || isNaN(annualRate) || isNaN(years) || P <= 0 || annualRate <= 0 || years <= 0) {
      return
    }

    const r = annualRate / 12 / 100 // monthly interest rate
    const n = years * 12 // total months

    const emiValue =
      (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)

    const totalPaymentValue = emiValue * n
    const totalInterestValue = totalPaymentValue - P

    setEmi(emiValue)
    setTotalInterest(totalInterestValue)
    setTotalPayment(totalPaymentValue)
    setCalculated(true)
  }

  const principalPercent =
    emi !== null && totalPayment !== null && totalPayment > 0
      ? (parseFloat(loanAmount) / totalPayment) * 100
      : 0
  const interestPercent = 100 - principalPercent

  return (
    <Card
      className="w-full bg-white border-gray-100 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(200,169,97,0.2)' }}
    >
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-bold text-[#1A202C] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 inline mr-2" />
          {t('projects.emi.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Loan Amount */}
        <div className="space-y-2">
          <Label
            htmlFor="emi-loan-amount"
            className="text-sm font-medium text-[#1A202C]/80"
          >
            {t('projects.emi.loanAmountLabel')}
          </Label>
          <Input
            id="emi-loan-amount"
            type="number"
            min={settings.emiMinLoan || '0'}
            max={settings.emiMaxLoan || undefined}
            value={loanAmount}
            onChange={(e) => {
              setLoanAmount(e.target.value)
              setCalculated(false)
            }}
            className="premium-input h-11"
            placeholder={t('projects.emi.loanAmountPlaceholder')}
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <Label
            htmlFor="emi-interest-rate"
            className="text-sm font-medium text-[#1A202C]/80"
          >
            {t('projects.emi.interestRateLabel')}
          </Label>
          <Input
            id="emi-interest-rate"
            type="number"
            min="0"
            step="0.1"
            value={interestRate}
            onChange={(e) => {
              userEdited.current = true
              setInterestRate(e.target.value)
              setCalculated(false)
            }}
            className="premium-input h-11"
            placeholder={t('projects.emi.interestRatePlaceholder')}
          />
        </div>

        {/* Loan Tenure */}
        <div className="space-y-2">
          <Label
            htmlFor="emi-tenure"
            className="text-sm font-medium text-[#1A202C]/80"
          >
            {t('projects.emi.tenureLabel')}
          </Label>
          <Input
            id="emi-tenure"
            type="number"
            min="1"
            max={settings.emiMaxTenure || undefined}
            value={tenure}
            onChange={(e) => {
              userEdited.current = true
              setTenure(e.target.value)
              setCalculated(false)
            }}
            className="premium-input h-11"
            placeholder={t('projects.emi.tenurePlaceholder')}
          />
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          className="btn-gold w-full h-11 text-base font-semibold bg-[#1E6B3A] hover:bg-[#1E6B3A]/90 text-[#FFFFFF] rounded-lg transition-all"
        >
          {t('projects.emi.calculateBtn')}
        </Button>

        {/* Results */}
        {calculated && emi !== null && totalInterest !== null && totalPayment !== null && (
          <>
            <Separator className="bg-gray-200" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#475569]">{t('projects.emi.monthlyEmi')}</span>
                <span className="text-lg font-bold text-[#1E6B3A]">
                  {formatBDT(emi)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#475569]">{t('projects.emi.totalInterest')}</span>
                <span className="text-lg font-bold text-[#1A202C]">
                  {formatBDT(totalInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#475569]">{t('projects.emi.totalPayment')}</span>
                <span className="text-lg font-bold text-[#1A202C]">
                  {formatBDT(totalPayment)}
                </span>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Bar Breakdown */}
            <div className="space-y-3">
              <div className="flex rounded-full overflow-hidden h-8 w-full">
                <div
                  className="flex items-center justify-center text-xs font-semibold text-[#FFFFFF] transition-all duration-500"
                  style={{
                    width: `${principalPercent}%`,
                    backgroundColor: '#1E6B3A',
                    minWidth: principalPercent > 0 ? '2rem' : '0',
                  }}
                >
                  {principalPercent > 12 && `${t('projects.emi.principal')} ${Math.round(principalPercent)}%`}
                </div>
                <div
                  className="flex items-center justify-center text-xs font-semibold text-[#1A202C] transition-all duration-500"
                  style={{
                    width: `${interestPercent}%`,
                    backgroundColor: '#E2E8F0',
                    minWidth: interestPercent > 0 ? '2rem' : '0',
                  }}
                >
                  {interestPercent > 12 && `${t('projects.emi.interest')} ${Math.round(interestPercent)}%`}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-xs text-[#475569]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#1E6B3A]" />
                  <span>
                    {t('projects.emi.principal')} {Math.round(principalPercent)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#E2E8F0]" />
                  <span>
                    {t('projects.emi.interest')} {Math.round(interestPercent)}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
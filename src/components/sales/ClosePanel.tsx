/**
 * Close Panel Component
 * Shows when qualified, with payment options and checkout link
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { QualificationResult, PlaybookData } from '@/lib/sales/types';

interface ClosePanelProps {
  qualification: QualificationResult;
  playbook: PlaybookData;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
}

export function ClosePanel({
  qualification,
  playbook,
  onMarkWon,
  onMarkLost,
}: ClosePanelProps) {
  if (!qualification.shouldClose) return null;

  const checkoutUrl = playbook.meta.offer.checkoutUrl;
  const payInFull = playbook.meta.offer.pricing.payInFull;
  const paymentPlan = playbook.meta.offer.pricing.paymentPlan[0];

  const recommendedPayment =
    qualification.paymentRecommendation === 'payment_plan'
      ? 'payment_plan'
      : 'pay_in_full';

  return (
    <Card className="border-green-500 bg-green-50 dark:bg-green-950">
      <CardHeader>
        <CardTitle className="text-green-900 dark:text-green-100">
          Ready to Close
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Closing Script */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-md">
          <p className="text-sm font-medium mb-2">Closing Script:</p>
          <p className="text-sm text-muted-foreground">
            {playbook.scripts.closeNow.ask}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {playbook.scripts.closeNow.paymentOptionPrompt}
          </p>
        </div>

        {/* Payment Options */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Payment Options</h4>
          <div className="grid grid-cols-2 gap-2">
            <Card
              className={`cursor-pointer transition-colors ${
                recommendedPayment === 'pay_in_full'
                  ? 'border-primary bg-primary/5'
                  : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{payInFull}€</p>
                    <p className="text-xs text-muted-foreground">Pay in full</p>
                  </div>
                  {recommendedPayment === 'pay_in_full' && (
                    <Badge>Recommended</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-colors ${
                recommendedPayment === 'payment_plan'
                  ? 'border-primary bg-primary/5'
                  : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{paymentPlan.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {paymentPlan.count} payments
                    </p>
                  </div>
                  {recommendedPayment === 'payment_plan' && (
                    <Badge>Recommended</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          className="w-full"
          onClick={() => window.open(checkoutUrl, '_blank')}
        >
          Open Checkout
          <ExternalLink className="ml-2 w-4 h-4" />
        </Button>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onMarkWon}>
            Mark as Won
          </Button>
          <Button variant="outline" className="flex-1" onClick={onMarkLost}>
            Mark as Lost
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


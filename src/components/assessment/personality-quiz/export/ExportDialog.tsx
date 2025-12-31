import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Image, FileText, Loader2, Check } from "lucide-react";

import { ExportData } from "./types";
import { SocialSlide1 } from "./SocialSlide1";
import { PDFPage1, PDFPage2, PDFPage3 } from "./PDFPages";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportData;
}

type ExportTab = 'social' | 'pdf';

// A4 dimensions at 96 DPI
const PDF_WIDTH = 794;
const PDF_HEIGHT = 1123;

export function ExportDialog({ open, onOpenChange, data }: Props) {
  const [activeTab, setActiveTab] = useState<ExportTab>('social');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const slideRef = useRef<HTMLDivElement>(null);
  const pdf1Ref = useRef<HTMLDivElement>(null);
  const pdf2Ref = useRef<HTMLDivElement>(null);
  const pdf3Ref = useRef<HTMLDivElement>(null);

  const generateSocialImage = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      if (slideRef.current) {
        const dataUrl = await toPng(slideRef.current, {
          quality: 1,
          pixelRatio: 2,
        });
        setGeneratedImage(dataUrl);
        toast.success("Image generated!");
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Export failed. Try using Chrome or download PDF instead.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = `${data.archetype.id}-personality-story.png`;
    link.href = generatedImage;
    link.click();
  };

  const generatePDF = useCallback(async () => {
    setIsGenerating(true);

    try {
      // Create PDF with exact A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [PDF_WIDTH, PDF_HEIGHT],
        hotfixes: ['px_scaling'],
      });

      const refs = [pdf1Ref, pdf2Ref, pdf3Ref];

      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        if (ref.current) {
          const dataUrl = await toPng(ref.current, {
            quality: 1,
            pixelRatio: 2,
            width: PDF_WIDTH,
            height: PDF_HEIGHT,
          });

          if (i > 0) {
            pdf.addPage();
          }

          // Add image at full page size
          pdf.addImage(dataUrl, 'PNG', 0, 0, PDF_WIDTH, PDF_HEIGHT);
        }
      }

      pdf.save(`${data.archetype.id}-learning-personality-report.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error("PDF generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [data.archetype.id]);

  const previewScale = 0.15;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Results
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ExportTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="social" className="gap-2">
              <Image className="h-4 w-4" />
              Social Media
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2">
              <FileText className="h-4 w-4" />
              PDF Report
            </TabsTrigger>
          </TabsList>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download a vertical story image (1080×1920) optimized for Instagram and Facebook stories.
            </p>

            {/* Preview */}
            <div className="flex justify-center py-4">
              <div
                className="relative border-2 border-primary/20 rounded-lg overflow-hidden shadow-lg"
                style={{
                  width: 1080 * previewScale,
                  height: 1920 * previewScale,
                }}
              >
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <SocialSlide1 data={data} />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center gap-3">
              {!generatedImage ? (
                <Button
                  size="lg"
                  onClick={generateSocialImage}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Image className="h-4 w-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Image ready!</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="lg" onClick={downloadImage}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Story Image
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => {
                        setGeneratedImage(null);
                        generateSocialImage();
                      }}
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PDF Tab */}
          <TabsContent value="pdf" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download a detailed 3-page PDF report with all your results, insights, and personalized recommendations.
            </p>

            {/* PDF Preview Thumbnails */}
            <div className="flex gap-4 justify-center flex-wrap py-4">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className="relative border rounded-lg overflow-hidden shadow-sm bg-white"
                  style={{
                    width: PDF_WIDTH * 0.12,
                    height: PDF_HEIGHT * 0.12,
                  }}
                >
                  <div
                    style={{
                      transform: 'scale(0.12)',
                      transformOrigin: 'top left',
                      width: PDF_WIDTH,
                      height: PDF_HEIGHT,
                    }}
                  >
                    {num === 1 && <PDFPage1 data={data} />}
                    {num === 2 && <PDFPage2 data={data} />}
                    {num === 3 && <PDFPage3 data={data} />}
                  </div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-white/80 px-1 rounded">
                    {num}/3
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button size="lg" onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Hidden render containers for export */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <div ref={slideRef}>
            <SocialSlide1 data={data} />
          </div>
          <div ref={pdf1Ref} style={{ width: PDF_WIDTH, height: PDF_HEIGHT }}>
            <PDFPage1 data={data} />
          </div>
          <div ref={pdf2Ref} style={{ width: PDF_WIDTH, height: PDF_HEIGHT }}>
            <PDFPage2 data={data} />
          </div>
          <div ref={pdf3Ref} style={{ width: PDF_WIDTH, height: PDF_HEIGHT }}>
            <PDFPage3 data={data} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

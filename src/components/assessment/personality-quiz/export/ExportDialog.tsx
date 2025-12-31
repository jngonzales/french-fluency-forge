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

import { ExportData, ExportFormat, FORMAT_DIMENSIONS } from "./types";
import { SocialSlide1 } from "./SocialSlide1";
import { SocialSlide2 } from "./SocialSlide2";
import { SocialSlide3 } from "./SocialSlide3";
import { PDFPage1, PDFPage2, PDFPage3 } from "./PDFPages";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportData;
}

type ExportTab = 'social' | 'pdf';

export function ExportDialog({ open, onOpenChange, data }: Props) {
  const [activeTab, setActiveTab] = useState<ExportTab>('social');
  const [format, setFormat] = useState<ExportFormat>('story');
  const [selectedSlides, setSelectedSlides] = useState<number[]>([1, 2, 3]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const slide3Ref = useRef<HTMLDivElement>(null);

  const pdf1Ref = useRef<HTMLDivElement>(null);
  const pdf2Ref = useRef<HTMLDivElement>(null);
  const pdf3Ref = useRef<HTMLDivElement>(null);

  const toggleSlide = (num: number) => {
    setSelectedSlides(prev => 
      prev.includes(num) 
        ? prev.filter(n => n !== num)
        : [...prev, num].sort()
    );
  };

  const generateSocialImages = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const refs = [slide1Ref, slide2Ref, slide3Ref];
      const images: string[] = [];

      for (const slideNum of selectedSlides) {
        const ref = refs[slideNum - 1];
        if (ref.current) {
          const dataUrl = await toPng(ref.current, {
            quality: 1,
            pixelRatio: 2,
          });
          images.push(dataUrl);
        }
      }

      setGeneratedImages(images);
      toast.success(`Generated ${images.length} image${images.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Export failed. Try using Chrome or download PDF instead.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSlides]);

  const downloadImage = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.download = `${data.archetype.id}-slide-${index + 1}-${format}.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadAllImages = () => {
    generatedImages.forEach((img, i) => {
      setTimeout(() => downloadImage(img, i), i * 300);
    });
  };

  const generatePDF = useCallback(async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, 1123],
      });

      const refs = [pdf1Ref, pdf2Ref, pdf3Ref];

      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        if (ref.current) {
          const dataUrl = await toPng(ref.current, {
            quality: 1,
            pixelRatio: 2,
          });

          if (i > 0) {
            pdf.addPage();
          }

          pdf.addImage(dataUrl, 'PNG', 0, 0, 794, 1123);
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

  const { width, height } = FORMAT_DIMENSIONS[format];
  const previewScale = 0.18;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            {/* Format Selection */}
            <div className="flex gap-2">
              {(Object.keys(FORMAT_DIMENSIONS) as ExportFormat[]).map((f) => (
                <Button
                  key={f}
                  variant={format === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFormat(f);
                    setGeneratedImages([]);
                  }}
                >
                  {FORMAT_DIMENSIONS[f].label}
                </Button>
              ))}
            </div>

            {/* Slide Selection */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Include slides:</span>
              {[1, 2, 3].map((num) => (
                <Button
                  key={num}
                  variant={selectedSlides.includes(num) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSlide(num)}
                >
                  {num}
                </Button>
              ))}
            </div>

            {/* Preview Thumbnails */}
            <div className="flex gap-4 justify-center flex-wrap py-4">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                    selectedSlides.includes(num)
                      ? "border-primary shadow-lg"
                      : "border-muted opacity-50"
                  }`}
                  style={{
                    width: width * previewScale,
                    height: height * previewScale,
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    {num === 1 && <SocialSlide1 data={data} format={format} />}
                    {num === 2 && <SocialSlide2 data={data} format={format} />}
                    {num === 3 && <SocialSlide3 data={data} format={format} />}
                  </div>
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Slide {num}
                  </div>
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <div className="flex justify-center gap-3">
              <Button
                size="lg"
                onClick={generateSocialImages}
                disabled={isGenerating || selectedSlides.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Generate Images
                  </>
                )}
              </Button>
            </div>

            {/* Generated Images Download */}
            {generatedImages.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {generatedImages.length} image{generatedImages.length > 1 ? 's' : ''} ready
                  </span>
                  <Button variant="outline" size="sm" onClick={downloadAllImages}>
                    Download All
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {generatedImages.map((img, i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadImage(img, i)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Slide {selectedSlides[i]}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
                  className="relative border rounded-lg overflow-hidden shadow-sm"
                  style={{
                    width: 794 * 0.15,
                    height: 1123 * 0.15,
                  }}
                >
                  <div
                    style={{
                      transform: 'scale(0.15)',
                      transformOrigin: 'top left',
                    }}
                  >
                    {num === 1 && <PDFPage1 data={data} />}
                    {num === 2 && <PDFPage2 data={data} />}
                    {num === 3 && <PDFPage3 data={data} />}
                  </div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
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
        <div className="fixed -left-[9999px] top-0">
          <div ref={slide1Ref}>
            <SocialSlide1 data={data} format={format} />
          </div>
          <div ref={slide2Ref}>
            <SocialSlide2 data={data} format={format} />
          </div>
          <div ref={slide3Ref}>
            <SocialSlide3 data={data} format={format} />
          </div>
          <div ref={pdf1Ref}>
            <PDFPage1 data={data} />
          </div>
          <div ref={pdf2Ref}>
            <PDFPage2 data={data} />
          </div>
          <div ref={pdf3Ref}>
            <PDFPage3 data={data} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

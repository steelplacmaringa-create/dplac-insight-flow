import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
      }

      toast.success('Arquivo carregado com sucesso!');
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  return (
    <Card 
      {...getRootProps()} 
      className={`
        p-12 border-2 border-dashed cursor-pointer transition-all duration-300
        ${isDragActive 
          ? 'border-primary bg-primary/5 scale-105' 
          : 'border-border hover:border-primary hover:bg-muted/50'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {isDragActive ? (
          <>
            <FileSpreadsheet className="w-16 h-16 text-primary animate-bounce" />
            <p className="text-lg font-medium text-primary">
              Solte o arquivo aqui...
            </p>
          </>
        ) : (
          <>
            <Upload className="w-16 h-16 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium mb-1">
                Arraste seu arquivo Excel aqui
              </p>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                .xlsx
              </span>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                .xls
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

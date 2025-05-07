// En un archivo separado como test/types/express-multer.d.ts
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding?: string;
      mimetype: string;
      size: number;
      destination?: string;
      filename?: string;
      path?: string;
      buffer?: Buffer;
      stream?: any; // Cambiamos el tipo para permitir null
    }
  }
}
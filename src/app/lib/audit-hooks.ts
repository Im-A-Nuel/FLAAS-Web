import { useState, useCallback } from 'react';
import { getRecords, getNextId } from './polkadot';

export interface AuditRecord {
  id: number;
  who: string;
  modelHash: string;
  institution: string;
  atBlock: number;
  accuracy: number;
  ipfsCid?: string;
  note?: string;
}

export const useAuditRecords = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<AuditRecord[]>([]);

  const getAllRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextId = await getNextId();
      const recordPromises: Promise<any>[] = [];

      for (let i = 0; i < nextId; i++) {
        recordPromises.push(getRecords(i));
      }

      const results = await Promise.all(recordPromises);

      const parsedRecords = results
        .map((result, index) => {
          if (!result || result === null) return null;

          const record: AuditRecord = {
            id: index,
            who: result.who || '',
            modelHash: result.modelHash || '',
            institution: result.institution || '',
            atBlock: parseInt(result.atBlock?.toString().replace(/,/g, '') || '0'),
            accuracy: parseFloat(result.accuracy?.toString().replace(/,/g, '') || '0'),
            ipfsCid: result.ipfsCid || undefined,
            note: result.note || undefined,
          };
          return record;
        })
        .filter(r => r !== null) as AuditRecord[];

      setRecords(parsedRecords.reverse()); // Newest first
      return parsedRecords;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecord = useCallback(async (id: number): Promise<AuditRecord | null> => {
    try {
      const result: any = await getRecords(id);

      if (!result || result === null) return null;

      return {
        id,
        who: result.who || '',
        modelHash: result.modelHash || '',
        institution: result.institution || '',
        atBlock: parseInt(result.atBlock?.toString().replace(/,/g, '') || '0'),
        accuracy: parseFloat(result.accuracy?.toString().replace(/,/g, '') || '0'),
        ipfsCid: result.ipfsCid || undefined,
        note: result.note || undefined,
      };
    } catch (err) {
      console.error('Failed to get record:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    records,
    getAllRecords,
    getRecord,
  };
};

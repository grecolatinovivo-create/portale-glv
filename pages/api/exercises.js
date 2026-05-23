/**
 * GET /api/exercises?lessonId=<id>
 * Restituisce i test esercizi collegati a una lezione specifica.
 * Include sezioni e domande con i dati per il rendering.
 *
 * Risposta: { tests: [{ id, title, sections: [{ id, name, questions: [...] }] }] }
 */
import prisma from '../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Non autenticato' });

  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: 'lessonId obbligatorio' });

  try {
    const tests = await prisma.exerciseTest.findMany({
      where: { lessonId },
      orderBy: { ordine: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        lingua: true,
        livello: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            timeMinutes: true,
            sortOrder: true,
            questions: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                questionType: true,
                sortOrder: true,
                title: true,
                instruction: true,
                contextText: true,
                audio: true,
                image: true,
                data: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ tests });
  } catch (err) {
    console.error('[exercises] DB error:', err);
    return res.status(500).json({ error: 'Errore server' });
  }
}

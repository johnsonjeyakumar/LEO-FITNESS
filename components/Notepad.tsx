import React, { useState } from 'react';
import { Note } from '../types';
import { BookOpen, Save, Plus, Trash2, Edit3, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';
import { firestoreService } from '../services/firestoreService';

interface Props {
  notes: Note[];
  onUpdateNotes: (notes: Note[]) => void;
}

interface NoteCardProps {
  note: Note;
}

const Notepad: React.FC<Props> = ({ notes, onUpdateNotes }) => {
  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const createNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      type: activeTab,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now()
    };

    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await firestoreService.saveNote(uid, note);
      } catch (e) {
        console.error("Failed to save note to Firestore:", e);
      }
    }

    const updatedNotes = [note, ...notes];
    onUpdateNotes(updatedNotes);
    setNewNote({ title: '', content: '' });
    setIsCreating(false);
  };

  const updateNote = async () => {
    if (!editingNote || !newNote.title.trim() || !newNote.content.trim()) return;

    const updatedNote: Note = {
      ...editingNote,
      title: newNote.title,
      content: newNote.content
    };

    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await firestoreService.saveNote(uid, updatedNote);
      } catch (e) {
        console.error("Failed to update note in Firestore:", e);
      }
    }

    const updatedNotes = notes.map(note =>
      note.id === editingNote.id ? updatedNote : note
    );
    onUpdateNotes(updatedNotes);
    setEditingNote(null);
    setNewNote({ title: '', content: '' });
  };

  const deleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await firestoreService.deleteNote(uid, id);
        } catch (e) {
          console.error("Failed to delete note from Firestore:", e);
        }
      }
      const updatedNotes = notes.filter(note => note.id !== id);
      onUpdateNotes(updatedNotes);
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setNewNote({ title: note.title, content: note.content });
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setIsCreating(false);
    setNewNote({ title: '', content: '' });
  };

  const filteredNotes = notes.filter(note => note.type === activeTab);

  const NoteCard: React.FC<NoteCardProps> = ({ note }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">
            {note.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            <span>{note.date}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(note)}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
            aria-label={`Edit ${note.title}`}
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            aria-label={`Delete ${note.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
        {note.content}
      </p>
    </motion.div>
  );

  return (
    <div className="p-6 lg:p-10 pb-32 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="text-primary" size={32} />
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Personal Notes</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white uppercase leading-tight">
            Training Journal
          </h1>
          <p className="text-gray-400 mt-3 text-sm lg:text-base">
            Document your progress, track insights, and maintain your fitness narrative.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-orange-600 text-black px-6 py-4 rounded font-display font-bold uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-3"
        >
          <Plus size={20} />
          New Note
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('workout')}
          className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'workout'
              ? 'bg-primary text-black'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
        >
          Workout Notes
        </button>
        <button
          onClick={() => setActiveTab('diet')}
          className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'diet'
              ? 'bg-primary text-black'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
        >
          Diet Notes
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(isCreating || editingNote) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-primary/30 rounded-xl p-6 mb-8"
          >
            <h3 className="text-xl font-display font-bold text-white mb-4 uppercase">
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Note Title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:bg-black/60 outline-none transition-all"
              />

              <textarea
                placeholder={`Write your ${activeTab} insights here...`}
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:bg-black/60 outline-none transition-all resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={editingNote ? updateNote : createNote}
                  className="bg-primary hover:bg-orange-600 text-black px-6 py-3 rounded font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  {editingNote ? 'Update' : 'Save'} Note
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-6 py-3 rounded font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      <div className="grid gap-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="text-gray-600 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-display font-bold text-gray-400 mb-2 uppercase">
              No {activeTab} Notes Yet
            </h3>
            <p className="text-gray-500">
              Start documenting your {activeTab} journey to track progress and insights.
            </p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))
        )}
      </div>
    </div>
  );
};

export default Notepad;

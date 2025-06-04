"use client"

import React, { useEffect, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import CharacterCount from "@tiptap/extension-character-count"
import * as RToolbar from "@radix-ui/react-toolbar"

import { Button } from "@/app/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet"
import DynamicTools from "./DynamicTools"

interface RichQuoteEditorProps {
  initialHTML?: string
  onChange?: (html: string) => void
  onCopy?: () => void
  onClear?: () => void
  onSave?: () => void
  onPreview?: () => void
  onMetaChange?: (tags: string[]) => void
}

export function useRichEditor(initialHTML: string, onChange?: (html: string) => void) {
  return useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
      }),
      CharacterCount.configure({ limit: 5000 }),
    ],
    content: initialHTML,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })
}

interface ToolbarButtonProps {
  command: string
  editor: Editor | null
  children: React.ReactNode
  label: string
}

function ToolbarButton({ command, editor, children, label }: ToolbarButtonProps) {
  const handle = () => {
    if (!editor) return
    const chain = editor.chain().focus() as any
    chain[command]().run()
  }
  const commandName = command.replace(/^toggle/, "").toLowerCase()
  const active = editor ? (editor as any).isActive(commandName) : false
  return (
    <RToolbar.Button
      onClick={handle}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`p-2 rounded hover:bg-gray-200 ${active ? "bg-gray-200" : ""}`}
    >
      {children}
    </RToolbar.Button>
  )
}

const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1">{children}</div>
)

function InputChip({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("")

  const addTag = (tag: string) => {
    const newTag = tag.trim()
    if (!newTag) return
    if (!value.includes(newTag)) onChange([...value, newTag])
    setInput("")
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(input)
    }
  }

  return (
    <div className="border rounded p-2 flex flex-wrap gap-1">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center bg-gray-200 px-2 py-0.5 rounded text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-1 text-gray-600 hover:text-gray-900"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Agregar etiqueta"
        className="flex-grow min-w-[80px] border-none outline-none bg-transparent text-sm"
      />
    </div>
  )
}

export function RichQuoteEditor({
  initialHTML = "",
  onChange,
  onCopy,
  onClear,
  onSave,
  onPreview,
  onMetaChange,
}: RichQuoteEditorProps) {
  const editor = useRichEditor(initialHTML, onChange)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tags, setTags] = useState<string[]>([])

  const insertAtEnd = (text: string) => {
    if (!editor) return
    editor.chain().focus('end').insertContent(text).run()
  }

  // Keep editor content in sync with `initialHTML` prop
  useEffect(() => {
    if (!editor) return
    if (initialHTML !== editor.getHTML()) {
      editor.commands.setContent(initialHTML)
    }
  }, [editor, initialHTML])

  useEffect(() => {
    onMetaChange?.(tags)
  }, [tags, onMetaChange])

  const charCount = editor?.storage.characterCount.characters() || 0
  const wordCount = editor?.storage.characterCount.words() || 0

  return (
    <div className="flex w-full max-w-full mx-auto">
      {/* Left Column (70%) */}
      <div className="w-[70%] border-r">
        <div className="flex items-center justify-between border-b bg-white px-4 py-2">
          <h2 className="font-semibold text-lg">Editor</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(editor?.getText() || "")
                onCopy?.()
              }}
            >
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                editor?.commands.setContent("")
                onClear?.()
              }}
            >
              Limpiar
            </Button>
            {onPreview && (
              <Button variant="outline" size="sm" onClick={onPreview}>
                Vista previa
              </Button>
            )}
            <Button className="bg-black text-white" onClick={onSave}>
              ✓ Save &amp; Close
            </Button>
          </div>
        </div>

        <RToolbar.Root className="flex w-full flex-wrap gap-1 bg-gray-50 p-3 border-b whitespace-nowrap overflow-x-auto">
          <ToolbarGroup>
            <ToolbarButton editor={editor} command="toggleBold" label="Negrita">
              <b>B</b>
            </ToolbarButton>
            <ToolbarButton editor={editor} command="toggleItalic" label="Cursiva">
              <i>I</i>
            </ToolbarButton>
            <ToolbarButton editor={editor} command="toggleUnderline" label="Subrayado">
              <u>U</u>
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarButton editor={editor} command="toggleBulletList" label="Lista">
              •
            </ToolbarButton>
            <ToolbarButton editor={editor} command="toggleOrderedList" label="Lista ordenada">
              1.
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarGroup>
            <RToolbar.Button asChild>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
                  Tags
                </Button>
              </SheetTrigger>
            </RToolbar.Button>
          </ToolbarGroup>
        </RToolbar.Root>

        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose-base w-full min-h-[640px] px-4 py-6 focus:outline-none"
        />

        <div className="p-4 border-t bg-white text-right">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-orange-600">{wordCount} palabras</span> · {charCount} caracteres
            <span className="ml-4 text-gray-500">(Recomendado: 250–350 palabras)</span>
          </p>
        </div>
      </div>

      {/* Right Column (30%) */}
      <div className="w-[30%] p-4 bg-slate-50 overflow-y-auto">
        <h3 className="font-semibold text-lg mb-4">Herramientas de IA</h3>
        <DynamicTools onInsert={insertAtEnd} />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[320px]">
          <SheetHeader>
            <SheetTitle>Etiquetas</SheetTitle>
          </SheetHeader>
          <InputChip value={tags} onChange={setTags} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

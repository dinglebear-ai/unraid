"use client"

// ---------------------------------------------------------------------------
// ai-elements.tsx — explicit re-export barrel
//
// Previously this file was `export * from "./core"` which caused tsc
// duplicate-export errors when core.tsx and the reskinned standalone files
// both defined the same name (Canvas/Node, Action/Actions, Source/SourceItem/
// SourceProps). This barrel uses a named list so TypeScript sees exactly one
// owner per export.
//
// Owner map (one canonical file per conflicting name):
//   Canvas, Node              → canvas.tsx   (CD-parity reskin)
//   Action, Actions,
//   ActionProps, ActionsProps → action.tsx / actions.tsx
//   Source, SourceItem,
//   SourceProps               → source.tsx   (CD-parity reskin)
//   Sources                  → sources.tsx
//   Everything else           → core.tsx
//
// Queue lives in core.tsx because the two barrel-consuming demos
// (ai-element-page.tsx, parity-demo.tsx) pass `tasks: AgentTask[]`, which
// is the core.tsx API. The standalone queue.tsx uses `items: QueueItem[]`
// and is consumed only by its own demo (ai-queue-demo.tsx).
// ---------------------------------------------------------------------------

// ── Canvas + Node (canvas.tsx owns both) ────────────────────────────────────
export { Canvas, Node } from "./canvas"
export type { CanvasProps, CanvasEdge, NodeProps } from "./canvas"

// ── Action + Actions (standalone reskins) ───────────────────────────────────
export { Action } from "./action"
export type { ActionProps } from "./action"
export { Actions } from "./actions"
export type { ActionsProps } from "./actions"

// ── Source + SourceItem + SourceProps (source.tsx is canonical) ─────────────
export { Source } from "./source"
export type { SourceItem, SourceProps } from "./source"

// ── Sources (sources.tsx is canonical) ──────────────────────────────────────
export { Sources } from "./sources"
export type { SourcesProps } from "./sources"

// ── Everything else from core.tsx ───────────────────────────────────────────
// Excludes the four collision groups above. core.tsx still owns:
//   Message, MessageAvatar, MessageContent, InlineCitation,
//   Conversation, ModelSelector, Queue (tasks API), TaskList,
//   TestResults, StackTrace, EnvironmentVariables, Checkpoint,
//   Confirmation, ContextPanel / Context, Shimmer, Suggestion,
//   Agent, Commit, JsxPreview, PackageInfo, Sandbox, SchemaDisplay,
//   Snippet, Image, OpenInChat, AudioPlayer, MicSelector, Persona,
//   SpeechInput, Transcription, VoiceSelector, Connection, Controls,
//   Edge, Panel
// and all their prop interfaces.
export {
  Agent,
  AudioPlayer,
  Checkpoint,
  Commit,
  Confirmation,
  Connection,
  ContextPanel,
  ContextPanel as Context,
  Controls,
  Conversation,
  Edge,
  EnvironmentVariables,
  Image,
  InlineCitation,
  JsxPreview,
  Message,
  MessageAvatar,
  MessageContent,
  MicSelector,
  ModelSelector,
  OpenInChat,
  PackageInfo,
  Panel,
  Persona,
  Queue,
  Sandbox,
  SchemaDisplay,
  Shimmer,
  Snippet,
  SpeechInput,
  StackTrace,
  Suggestion,
  TaskList,
  TestResults,
  Transcription,
  VoiceSelector,
} from "./core"

export type {
  AgentProps,
  AgentTask,
  AudioPlayerProps,
  CheckpointProps,
  CommitProps,
  ConfirmationProps,
  ConnectionProps,
  ContextPanelProps,
  ConversationProps,
  EdgeProps,
  EnvironmentVariable,
  EnvironmentVariablesProps,
  AuroraImageProps,
  InlineCitationProps,
  JsxPreviewProps,
  MessageAvatarProps,
  MessageProps,
  MicSelectorProps,
  ModelSelectorProps,
  OpenInChatProps,
  PackageInfoProps,
  PanelProps,
  PersonaProps,
  QueueProps,
  SandboxProps,
  SchemaDisplayProps,
  SnippetProps,
  SpeechInputProps,
  StackFrame,
  StackTraceProps,
  SuggestionOption,
  SuggestionProps,
  TaskListProps,
  TestResult,
  TestResultsProps,
  TranscriptionProps,
  TranscriptionSegment,
  VoiceSelectorProps,
  // ControlsProps lives only in core.tsx — no collision
  ControlsProps,
} from "./core"

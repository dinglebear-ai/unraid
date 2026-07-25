import * as React from "react"
import { CircleCheck, CircleDashed, ListChecks, CircleX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge, type BadgeTone } from "@/components/ui/aurora/badge"
import { Spinner } from "@/components/ui/aurora/spinner"

export interface AgentTask {
  id: string
  title: string
  description?: string
  status: "queued" | "running" | "completed" | "failed"
}

export interface TaskListProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks: AgentTask[]
}

type TaskTone = {
  /** Icon color for the row leading glyph. */
  color: string
  /** Leading status icon. */
  icon: React.ReactNode
  /** Badge tone for the trailing status chip. */
  badge: BadgeTone
  /** Whether the trailing badge renders a status dot. */
  dot: boolean
  /** Whether the row is highlighted (active/running). */
  active: boolean
}

const taskTone: Record<AgentTask["status"], TaskTone> = {
  queued: {
    color: "var(--aurora-text-muted)",
    icon: <CircleDashed className="size-[18px]" aria-hidden />,
    badge: "neutral",
    dot: false,
    active: false,
  },
  running: {
    color: "var(--axon-orange)",
    icon: <Spinner size="sm" tone="muted" style={{ color: "var(--axon-orange)" }} />,
    badge: "warn",
    dot: true,
    active: true,
  },
  completed: {
    color: "var(--aurora-success)",
    icon: <CircleCheck className="size-[18px]" aria-hidden />,
    badge: "success",
    dot: false,
    active: false,
  },
  failed: {
    color: "var(--aurora-error)",
    icon: <CircleX className="size-[18px]" aria-hidden />,
    badge: "error",
    dot: true,
    active: true,
  },
}

const TASK_STATUS_LABEL: Record<AgentTask["status"], string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
}

const TaskList = ({ ref, className, tasks, style, ...props }: TaskListProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const done = tasks.filter((t) => t.status === "completed").length

    return (
      <div
        ref={ref}
        className={cn("grid", className)}
        style={{
          background: "var(--aurora-surface-raised)",
          border: "1px solid var(--aurora-border-strong)",
          borderRadius: "var(--aurora-radius-1)",
          boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
          padding: "18px 22px 20px",
          ...style,
        }}
        {...props}
      >
        <div
          className="flex items-center justify-between"
          style={{ paddingBottom: 12 }}
        >
          <span
            className="flex items-center gap-2.5"
            style={{
              color: "var(--aurora-text-primary)",
              fontFamily: "var(--aurora-font-sans, Inter, sans-serif)",
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            <ListChecks
              className="size-[18px] shrink-0"
              aria-hidden
              style={{ color: "var(--axon-orange)" }}
            />
            Tasks
          </span>
          <span
            className="aurora-text-meta tabular-nums"
            style={{
              color: "var(--axon-orange-strong)",
              fontWeight: 700,
            }}
          >
            {done}/{tasks.length}
          </span>
        </div>
        <div
          aria-hidden
          style={{
            height: 2,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, var(--aurora-accent-primary) 0%, var(--axon-orange) 58%, transparent 100%)",
          }}
        />

        <div className="grid" style={{ gap: 4, paddingTop: 12 }}>
          {tasks.map((task) => {
            const tone = taskTone[task.status]
            return (
              <div
                key={task.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                style={{
                  color: tone.color,
                  borderRadius: 12,
                  border: "1px solid transparent",
                  borderColor: tone.active
                    ? "var(--axon-orange-border)"
                    : "transparent",
                  background: tone.active
                    ? "var(--axon-orange-surface)"
                    : "transparent",
                  padding: "10px 14px",
                  transition:
                    "background var(--motion-duration-fast) var(--motion-ease-out), border-color var(--motion-duration-fast) var(--motion-ease-out)",
                }}
              >
                <span className="flex size-[18px] items-center justify-center">
                  {tone.icon}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate"
                    style={{
                      color: "var(--aurora-text-primary)",
                      fontFamily: "var(--aurora-font-sans, Inter, sans-serif)",
                      fontSize: 15.5,
                      fontWeight: 600,
                      letterSpacing: 0,
                    }}
                  >
                    {task.title}
                  </span>
                  {task.description ? (
                    <span className="block aurora-text-meta">{task.description}</span>
                  ) : null}
                </span>
                <Badge variant={tone.badge} dot={tone.dot} pulse={tone.active}>
                  {TASK_STATUS_LABEL[task.status]}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
TaskList.displayName = "TaskList"

export { TaskList, TaskList as Task }
export default TaskList

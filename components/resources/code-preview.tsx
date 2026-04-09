'use client'

import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HighlightMode = 'js' | 'html' | 'css' | 'json' | 'yaml' | 'sql' | 'markdown' | 'plain'

interface CodePreviewProps {
  code: string
  language: string
  className?: string
}

type Token = {
  text: string
  className?: string
}

type TokenPattern = {
  regex: RegExp
  className: string
  priority: number
}

const JS_KEYWORDS =
  /\b(?:const|let|var|function|return|if|else|for|while|switch|case|break|class|extends|new|import|from|export|default|async|await|try|catch|throw|interface|type|enum|implements|public|private|protected|readonly|static|this|super|yield|in|of|as|void|typeof|instanceof)\b/

const SQL_KEYWORDS =
  /\b(?:select|from|where|join|left|right|inner|outer|group|order|by|limit|insert|into|values|update|set|delete|create|table|alter|drop|and|or|not|null|true|false|case|when|then|else|end|distinct|having|union|all|exists|between|like|in)\b/i

const YAML_KEYWORDS = /\b(?:true|false|null|yes|no|on|off)\b/i

function resolveHighlightMode(language: string): HighlightMode {
  switch (language.toLowerCase()) {
    case 'html':
    case 'xml':
      return 'html'
    case 'css':
      return 'css'
    case 'javascript':
    case 'typescript':
    case 'appscript':
    case 'shell':
      return 'js'
    case 'json':
      return 'json'
    case 'yaml':
      return 'yaml'
    case 'sql':
      return 'sql'
    case 'markdown':
      return 'markdown'
    default:
      return 'plain'
  }
}

function getPatterns(mode: HighlightMode): TokenPattern[] {
  switch (mode) {
    case 'js':
      return [
        { regex: /\/\/.*$/g, className: 'text-emerald-400', priority: 5 },
        { regex: /\/\*[^]*?\*\//g, className: 'text-emerald-400', priority: 5 },
        { regex: /(['"`])(?:\\.|(?!\1)[^\\])*\1/g, className: 'text-amber-300', priority: 4 },
        { regex: JS_KEYWORDS, className: 'text-sky-400', priority: 3 },
        { regex: /\b(?:true|false|null|undefined)\b/g, className: 'text-violet-300', priority: 3 },
        { regex: /\b\d+(?:\.\d+)?\b/g, className: 'text-fuchsia-400', priority: 2 },
        { regex: /\b[A-Z][A-Z0-9_]+\b/g, className: 'text-cyan-300', priority: 1 },
      ]
    case 'html':
      return [
        { regex: /<!--[^]*?-->/g, className: 'text-emerald-400', priority: 5 },
        { regex: /<\/?[A-Za-z][\w:-]*/g, className: 'text-sky-400', priority: 4 },
        { regex: /[\w:-]+(?=\=)/g, className: 'text-violet-300', priority: 3 },
        { regex: /(['"`])(?:\\.|(?!\1)[^\\])*\1/g, className: 'text-amber-300', priority: 3 },
        { regex: /\b\d+(?:\.\d+)?\b/g, className: 'text-fuchsia-400', priority: 1 },
      ]
    case 'css':
      return [
        { regex: /\/\*[^]*?\*\//g, className: 'text-emerald-400', priority: 5 },
        { regex: /@[A-Za-z-]+/g, className: 'text-sky-400', priority: 4 },
        { regex: /[\w-]+(?=\s*:)/g, className: 'text-violet-300', priority: 3 },
        { regex: /(['"`])(?:\\.|(?!\1)[^\\])*\1/g, className: 'text-amber-300', priority: 3 },
        { regex: /#[0-9a-fA-F]{3,8}\b/g, className: 'text-fuchsia-400', priority: 2 },
        { regex: /\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?\b/g, className: 'text-cyan-300', priority: 1 },
      ]
    case 'json':
      return [
        { regex: /"(?:\\.|[^"\\])*"(?=\s*:)/g, className: 'text-sky-400', priority: 4 },
        { regex: /"(?:\\.|[^"\\])*"/g, className: 'text-amber-300', priority: 3 },
        { regex: /\b(?:true|false|null)\b/g, className: 'text-violet-300', priority: 3 },
        { regex: /\b\d+(?:\.\d+)?\b/g, className: 'text-fuchsia-400', priority: 2 },
      ]
    case 'yaml':
      return [
        { regex: /^\s*[^#:\n]+(?=\s*:)/g, className: 'text-sky-400', priority: 4 },
        { regex: /#.*/g, className: 'text-emerald-400', priority: 3 },
        { regex: /(['"`])(?:\\.|(?!\1)[^\\])*\1/g, className: 'text-amber-300', priority: 3 },
        { regex: YAML_KEYWORDS, className: 'text-violet-300', priority: 2 },
        { regex: /\b\d+(?:\.\d+)?\b/g, className: 'text-fuchsia-400', priority: 1 },
      ]
    case 'sql':
      return [
        { regex: /--.*$/g, className: 'text-emerald-400', priority: 5 },
        { regex: /\/\*[^]*?\*\//g, className: 'text-emerald-400', priority: 5 },
        { regex: /(['"`])(?:\\.|(?!\1)[^\\])*\1/g, className: 'text-amber-300', priority: 4 },
        { regex: SQL_KEYWORDS, className: 'text-sky-400', priority: 3 },
        { regex: /\b\d+(?:\.\d+)?\b/g, className: 'text-fuchsia-400', priority: 2 },
      ]
    case 'markdown':
      return [
        { regex: /^#{1,6}\s.*$/gm, className: 'text-sky-400 font-semibold', priority: 5 },
        { regex: /\[(.*?)\]\((.*?)\)/g, className: 'text-cyan-300', priority: 4 },
        { regex: /\*\*(.*?)\*\*/g, className: 'text-amber-300 font-semibold', priority: 3 },
        { regex: /`([^`]+)`/g, className: 'text-violet-300', priority: 3 },
      ]
    default:
      return []
  }
}

function tokenizeLine(line: string, mode: HighlightMode): Token[] {
  const patterns = getPatterns(mode)
  if (patterns.length === 0) {
    return [{ text: line }]
  }

  const tokens: Token[] = []
  let index = 0

  while (index < line.length) {
    let bestMatch: { start: number; end: number; className: string; priority: number } | null =
      null

    for (const pattern of patterns) {
      pattern.regex.lastIndex = index
      const match = pattern.regex.exec(line)

      if (!match || match.index < index) continue

      const candidate = {
        start: match.index,
        end: match.index + match[0].length,
        className: pattern.className,
        priority: pattern.priority,
      }

      if (
        !bestMatch ||
        candidate.start < bestMatch.start ||
        (candidate.start === bestMatch.start && candidate.priority > bestMatch.priority)
      ) {
        bestMatch = candidate
      }
    }

    if (!bestMatch) {
      tokens.push({ text: line.slice(index) })
      break
    }

    if (bestMatch.start > index) {
      tokens.push({ text: line.slice(index, bestMatch.start) })
    }

    tokens.push({
      text: line.slice(bestMatch.start, bestMatch.end),
      className: bestMatch.className,
    })

    index = bestMatch.end
  }

  return tokens
}

function renderTokens(tokens: Token[]): ReactNode {
  return tokens.map((token, index) => {
    if (!token.className) {
      return <Fragment key={index}>{token.text}</Fragment>
    }

    return (
      <span key={index} className={token.className}>
        {token.text}
      </span>
    )
  })
}

export function CodePreview({ code, language, className }: CodePreviewProps) {
  const mode = resolveHighlightMode(language)
  const lines = code.split('\n')

  return (
    <pre
      className={cn(
        'overflow-auto rounded-lg border bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-200',
        className
      )}
    >
      <code className="block">
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className="whitespace-pre">
            {renderTokens(tokenizeLine(line, mode))}
          </div>
        ))}
      </code>
    </pre>
  )
}

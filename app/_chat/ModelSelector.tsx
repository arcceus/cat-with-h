import React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Bot } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChatStore, type AIModel } from '@/store/chatStore'

interface ModelSelectorProps {
  className?: string
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  const { selectedModel, setSelectedModel } = useChatStore()

  const models: { id: AIModel; name: string; description: string }[] = [
    { 
      id: 'gemini', 
      name: 'Gemini', 
      description: 'Google\'s Gemini AI model' 
    },
    { 
      id: 'ollama', 
      name: 'Ollama', 
      description: 'Self-hosted open-source model via Ollama' 
    }
  ]

  const currentModel = models.find(m => m.id === selectedModel) || models[0]

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant={selectedModel === 'ollama' ? "secondary" : "ghost"}
                size="icon"
                className={`rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground ${className}`}
              >
                <Bot className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {models.map(model => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={selectedModel === model.id ? 'bg-muted' : ''}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>
          <p>Switch AI model ({currentModel.name})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ModelSelector

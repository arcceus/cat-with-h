export interface Chat{
    chatId: string,
    messages: Message[],
    updatedAt: string,
    title: string
}

export interface Message{
    chatId: string,
    messageId: string,
    content: {
        user: string,
        ai?: string
    }
}

export interface TextBlock{
    blockId?: string,
    chatId: string,
    messageId: string,
    position: {
        x: number,
        y: number
    },
    size: {
        height: number,
        width: number
    },
    type: "text" | "code" | "image"
}

export interface Canvas{
    textBlocks: TextBlock[],
    canvasId: string,
    updatedAt: string
}
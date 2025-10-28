// src/components/detail/FFFReplyBox.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Profile } from '@/types/database'
import FFFReplyComposer from './FFFReplyComposer'

interface ReplyBoxProps {
  profile: Profile | null
  parentId: string // ✅ 어떤 트윗에 대한 댓글인지
  onReply?: (newReply: any) => void
}

/**
 * ✅ FFFReplyBox — 게시물 아래에 위치하는 "댓글 작성창" 버전
 */
const ReplyBox = ({ profile, parentId, onReply }: ReplyBoxProps) => {
  const [open, setOpen] = useState(false)

  const handleReply = async (newReply: any) => {
    onReply?.(newReply)
    setOpen(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-sm p-5 mt-6 mb-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          댓글 작성
          {profile?.nickname && (
            <span className="ml-2 text-muted-foreground text-sm">- {profile.nickname}</span>
          )}
        </h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              작성하기
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>댓글 작성하기</DialogTitle>
            </DialogHeader>

            <FFFReplyComposer
              parentId={parentId}
              onReply={handleReply}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ReplyBox

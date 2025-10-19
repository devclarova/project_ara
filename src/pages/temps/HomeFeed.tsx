// src/pages/HomeFeed.tsx
import { useState } from 'react'
import TweetComposer from '../../components/feed/TweetComposer'
import TweetList from '../../components/feed/TweetList'
import Header from '../../components/layout/Header'
import SidebarLeft from '../../components/layout/SidebarLeft'
import SidebarRight from '../../components/layout/SidebarRight'
import { mockTweets, type Tweet } from '../../data/mockTweet'

const HomeFeed = () => {
  const [tweets, setTweets] = useState<Tweet[]>(mockTweets)

  const handleAddTweet = (content: string) => {
    const newTweet: Tweet = {
      id: Date.now().toString(),
      author: 'You',
      handle: 'your_handle',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content,
      stats: { reposts: 0, quotes: 0, likes: 0, bookmarks: 0 },
      replies: [],
      created_at: new Date().toISOString(),
    }
    setTweets(prev => [newTweet, ...prev])
  }

  return (
    <div className="flex max-w-7xl mx-auto">
      <SidebarLeft onPost={handleAddTweet} />
      <main className="flex-1 min-h-screen border-r border-gray-200">
        <Header title="Home" />
        <TweetComposer onPost={handleAddTweet} />
        <TweetList tweets={tweets || []} />
      </main>
      <SidebarRight />
    </div>
  )
}

export default HomeFeed

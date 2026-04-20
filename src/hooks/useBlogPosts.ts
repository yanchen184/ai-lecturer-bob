import { useEffect, useState } from 'react'
import { subscribeToPosts, type FirestorePost } from '../firebase'
import { blogPosts as staticPosts, type BlogPost } from '../data/blogPosts'

/**
 * 讀取用的統一 BlogPost 型別（給前台頁面用）
 * Firestore 的 FirestorePost 多了 published/createdAt/updatedAt，
 * 對一般讀者來說和靜態 BlogPost 是同一種東西。
 */
export type BlogPostView = BlogPost

/**
 * 將 FirestorePost 轉為靜態 BlogPost 結構，讓現有頁面不必改動渲染邏輯。
 */
const toBlogPost = (post: FirestorePost): BlogPostView => ({
  id: post.id ?? post.slug,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  publishDate: post.publishDate,
  updateDate: post.updateDate,
  category: post.category,
  tags: post.tags,
  readingTime: post.readingTime,
  featured: post.featured,
})

/**
 * 給前台讀者用的 hook：優先 Firestore（只訂閱 published=true），
 * 若 Firestore 為空則 fallback 到靜態 blogPosts。
 *
 * 回傳 isLoading 讓頁面能避免「Firestore 還沒回來就顯示 fallback」的閃爍。
 */
export const useBlogPosts = (): {
  posts: BlogPostView[]
  isLoading: boolean
  source: 'firestore' | 'static'
} => {
  const [posts, setPosts] = useState<BlogPostView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState<'firestore' | 'static'>('static')

  useEffect(() => {
    const unsub = subscribeToPosts(
      (firestorePosts) => {
        if (firestorePosts.length > 0) {
          setPosts(firestorePosts.map(toBlogPost))
          setSource('firestore')
        } else {
          setPosts(staticPosts)
          setSource('static')
        }
        setIsLoading(false)
      },
      true, // publishedOnly
      (error) => {
        console.error('useBlogPosts 訂閱錯誤，fallback 靜態資料:', error)
        setPosts(staticPosts)
        setSource('static')
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { posts, isLoading, source }
}

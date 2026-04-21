import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  subscribeToPosts,
  createPost,
  updatePost,
  deletePost,
  type FirestorePost,
} from '../../firebase'
import {
  slugifyTitle,
  estimateReadingTime,
  parseTagsInput,
  todayISODate,
} from './blogEditorUtils'

type EditorTab = 'list' | 'edit'

type DefaultStyleChoice = 'auto' | 'neub' | 'anti'

interface FormState {
  id?: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  publishDate: string
  updateDate: string
  category: string
  tags: string // 逗號分隔
  readingTime: number
  featured: boolean
  published: boolean
  /** 'auto' 代表不指定（讓讀者選擇或系統預設），儲存時轉為 undefined */
  defaultStyle: DefaultStyleChoice
  slugEdited: boolean // 記住 slug 是否被手動改過，改過就不再自動覆蓋
}

const EMPTY_FORM: FormState = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  author: '陳彥彤',
  publishDate: todayISODate(),
  updateDate: '',
  category: '',
  tags: '',
  readingTime: 1,
  featured: false,
  published: false,
  defaultStyle: 'auto',
  slugEdited: false,
}

/**
 * Firestore Post -> 表單狀態
 */
const postToForm = (post: FirestorePost): FormState => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author || '陳彥彤',
  publishDate: post.publishDate || todayISODate(),
  updateDate: post.updateDate ?? '',
  category: post.category,
  tags: post.tags.join(', '),
  readingTime: post.readingTime || 1,
  featured: post.featured,
  published: post.published,
  defaultStyle: post.defaultStyle ?? 'auto',
  slugEdited: true, // 編輯既有文章不自動覆寫 slug
})

/**
 * 表單狀態 -> Firestore Post 寫入 payload
 */
const formToPayload = (
  form: FormState
): Omit<FirestorePost, 'id' | 'createdAt' | 'updatedAt'> => ({
  slug: form.slug.trim(),
  title: form.title.trim(),
  excerpt: form.excerpt.trim(),
  content: form.content,
  author: form.author.trim() || '陳彥彤',
  publishDate: form.publishDate || todayISODate(),
  updateDate: form.updateDate || undefined,
  category: form.category.trim(),
  tags: parseTagsInput(form.tags),
  readingTime: Number(form.readingTime) || 1,
  featured: form.featured,
  published: form.published,
  defaultStyle: form.defaultStyle === 'auto' ? undefined : form.defaultStyle,
})

/**
 * 部落格文章 CMS 子頁：
 * - list：所有文章列表（含草稿），可刪除、切換發佈狀態、進入編輯
 * - edit：Markdown 表單，新增或編輯
 */
const AdminBlogEditor = () => {
  const [tab, setTab] = useState<EditorTab>('list')
  const [posts, setPosts] = useState<FirestorePost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')

  // 訂閱全部文章（不過濾 published，因為 admin 也要看草稿）
  useEffect(() => {
    const unsub = subscribeToPosts(
      (list) => {
        setPosts(list)
        setIsLoading(false)
      },
      false,
      (error) => {
        console.error('AdminBlogEditor 訂閱失敗:', error)
        setIsLoading(false)
        setStatusMessage(`訂閱失敗：${error.message}`)
      }
    )
    return () => unsub()
  }, [])

  // 更新表單欄位的 helper
  const updateForm = useCallback(<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleTitleChange = useCallback(
    (title: string) => {
      setForm((prev) => ({
        ...prev,
        title,
        // slug 沒被手動編輯才自動產生
        slug: prev.slugEdited ? prev.slug : slugifyTitle(title),
      }))
    },
    []
  )

  const handleSlugChange = useCallback((slug: string) => {
    setForm((prev) => ({ ...prev, slug, slugEdited: true }))
  }, [])

  const handleAutoEstimateReadingTime = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      readingTime: estimateReadingTime(prev.content),
    }))
  }, [])

  const startNewPost = useCallback(() => {
    setForm({ ...EMPTY_FORM, publishDate: todayISODate() })
    setStatusMessage('')
    setTab('edit')
  }, [])

  const startEditPost = useCallback((post: FirestorePost) => {
    setForm(postToForm(post))
    setStatusMessage('')
    setTab('edit')
  }, [])

  const handleTogglePublished = useCallback(
    async (post: FirestorePost) => {
      if (!post.id) return
      try {
        await updatePost(post.id, { published: !post.published })
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知錯誤'
        setStatusMessage(`切換發佈狀態失敗：${message}`)
      }
    },
    []
  )

  const handleDelete = useCallback(async (post: FirestorePost) => {
    if (!post.id) return
    const confirmed = window.confirm(`確定要刪除「${post.title}」？`)
    if (!confirmed) return
    try {
      await deletePost(post.id)
      setStatusMessage(`已刪除：${post.title}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知錯誤'
      setStatusMessage(`刪除失敗：${message}`)
    }
  }, [])

  const handleSave = useCallback(async () => {
    // 基本驗證
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setStatusMessage('標題、slug、內文為必填')
      return
    }
    setSaving(true)
    setStatusMessage('')
    try {
      const payload = formToPayload(form)
      if (form.id) {
        await updatePost(form.id, payload)
        setStatusMessage('已更新文章')
      } else {
        const newId = await createPost(payload)
        // 保留在編輯模式，讓作者可以繼續修改剛建立的文章
        setForm((prev) => ({ ...prev, id: newId }))
        setStatusMessage('已建立文章')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知錯誤'
      setStatusMessage(`儲存失敗：${message}`)
    } finally {
      setSaving(false)
    }
  }, [form])

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      // 草稿置頂，其次依 publishDate 新到舊
      if (a.published !== b.published) return a.published ? 1 : -1
      return a.publishDate < b.publishDate ? 1 : -1
    })
  }, [posts])

  return (
    <div className="space-y-4">
      {/* 子 Tab */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <SubTabButton
            active={tab === 'list'}
            onClick={() => setTab('list')}
          >
            文章列表（{posts.length}）
          </SubTabButton>
          <SubTabButton
            active={tab === 'edit'}
            onClick={() => {
              if (tab !== 'edit') startNewPost()
            }}
          >
            {form.id ? '編輯文章' : '新增文章'}
          </SubTabButton>
        </div>
        {tab === 'list' && (
          <button
            type="button"
            onClick={startNewPost}
            className="px-4 py-2 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600"
          >
            + 新增文章
          </button>
        )}
      </div>

      {/* 狀態訊息 */}
      {statusMessage && (
        <div className="text-sm px-4 py-2 rounded bg-blue-50 text-blue-700 border border-blue-100">
          {statusMessage}
        </div>
      )}

      {/* 列表 */}
      {tab === 'list' && (
        <PostList
          posts={sortedPosts}
          isLoading={isLoading}
          onEdit={startEditPost}
          onDelete={handleDelete}
          onTogglePublished={handleTogglePublished}
        />
      )}

      {/* 編輯器 */}
      {tab === 'edit' && (
        <PostForm
          form={form}
          saving={saving}
          onTitleChange={handleTitleChange}
          onSlugChange={handleSlugChange}
          onEstimateReadingTime={handleAutoEstimateReadingTime}
          onUpdate={updateForm}
          onSave={handleSave}
          onCancel={() => {
            setForm(EMPTY_FORM)
            setTab('list')
          }}
        />
      )}
    </div>
  )
}

// -------------------- 子元件 --------------------

interface SubTabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

const SubTabButton = ({ active, onClick, children }: SubTabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
  </button>
)

interface PostListProps {
  posts: FirestorePost[]
  isLoading: boolean
  onEdit: (post: FirestorePost) => void
  onDelete: (post: FirestorePost) => void
  onTogglePublished: (post: FirestorePost) => void
}

const PostList = ({
  posts,
  isLoading,
  onEdit,
  onDelete,
  onTogglePublished,
}: PostListProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm shadow-sm">
        載入中...
      </div>
    )
  }
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm shadow-sm">
        尚未建立任何文章。一般讀者看到的會是 fallback 的靜態文章。
      </div>
    )
  }
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th className="py-2 px-4">標題</th>
            <th className="py-2 px-4">分類</th>
            <th className="py-2 px-4">發佈日</th>
            <th className="py-2 px-4">狀態</th>
            <th className="py-2 px-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-4 text-gray-800">
                <div className="font-medium">{post.title}</div>
                <div className="text-xs text-gray-400">{post.slug}</div>
              </td>
              <td className="py-2 px-4 text-gray-600">{post.category}</td>
              <td className="py-2 px-4 text-gray-600">{post.publishDate}</td>
              <td className="py-2 px-4">
                <button
                  type="button"
                  onClick={() => onTogglePublished(post)}
                  className={`text-xs px-2 py-0.5 rounded ${
                    post.published
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  {post.published ? '已發佈' : '草稿'}
                </button>
              </td>
              <td className="py-2 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(post)}
                  className="text-sky-600 hover:text-sky-700 text-xs mr-3"
                >
                  編輯
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  className="text-red-500 hover:text-red-600 text-xs"
                >
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PostFormProps {
  form: FormState
  saving: boolean
  onTitleChange: (value: string) => void
  onSlugChange: (value: string) => void
  onEstimateReadingTime: () => void
  onUpdate: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  onSave: () => void
  onCancel: () => void
}

const PostForm = ({
  form,
  saving,
  onTitleChange,
  onSlugChange,
  onEstimateReadingTime,
  onUpdate,
  onSave,
  onCancel,
}: PostFormProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <FormField label="標題 *">
        <input
          type="text"
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="form-input"
          placeholder="文章標題"
        />
      </FormField>

      <FormField label="Slug *" hint="會自動從標題產生，可手動覆寫">
        <input
          type="text"
          value={form.slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="form-input font-mono text-sm"
          placeholder="article-slug"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="分類">
          <input
            type="text"
            value={form.category}
            onChange={(e) => onUpdate('category', e.target.value)}
            className="form-input"
            placeholder="例如：後端開發"
          />
        </FormField>
        <FormField label="標籤（以逗號分隔）">
          <input
            type="text"
            value={form.tags}
            onChange={(e) => onUpdate('tags', e.target.value)}
            className="form-input"
            placeholder="Spring Boot, Redis, 高併發"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="作者">
          <input
            type="text"
            value={form.author}
            onChange={(e) => onUpdate('author', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="發佈日">
          <input
            type="date"
            value={form.publishDate}
            onChange={(e) => onUpdate('publishDate', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="更新日（選填）">
          <input
            type="date"
            value={form.updateDate}
            onChange={(e) => onUpdate('updateDate', e.target.value)}
            className="form-input"
          />
        </FormField>
      </div>

      <FormField label="摘要">
        <textarea
          value={form.excerpt}
          onChange={(e) => onUpdate('excerpt', e.target.value)}
          rows={3}
          className="form-input"
          placeholder="會顯示在列表與 meta description"
        />
      </FormField>

      <FormField label="內文（Markdown）*">
        <textarea
          value={form.content}
          onChange={(e) => onUpdate('content', e.target.value)}
          rows={18}
          className="form-input font-mono text-sm"
          placeholder={'## 第一段\n\n內容...\n\n```java\n// code\n```'}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="閱讀時間（分鐘）">
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={form.readingTime}
              onChange={(e) => onUpdate('readingTime', Number(e.target.value))}
              className="form-input flex-1"
            />
            <button
              type="button"
              onClick={onEstimateReadingTime}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
            >
              自動估算
            </button>
          </div>
        </FormField>
        <FormField label="精選">
          <label className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => onUpdate('featured', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">標記為精選</span>
          </label>
        </FormField>
        <FormField label="狀態">
          <label className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => onUpdate('published', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">
              發佈（關閉則為草稿）
            </span>
          </label>
        </FormField>
      </div>

      <FormField
        label="預設風格"
        hint="作者建議的預設風格；讀者若在前台切換過（localStorage），仍以讀者選擇為準。"
      >
        <div className="flex flex-wrap gap-4 h-10 items-center">
          {(['auto', 'neub', 'anti'] as const).map((choice) => (
            <label
              key={choice}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <input
                type="radio"
                name="defaultStyle"
                value={choice}
                checked={form.defaultStyle === choice}
                onChange={() => onUpdate('defaultStyle', choice)}
                className="w-4 h-4"
              />
              <span>
                {choice === 'auto'
                  ? '自動（不指定）'
                  : choice === 'neub'
                  ? 'Neub（黃黑粗框）'
                  : 'Anti（紙張手寫）'}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
          disabled={saving}
        >
          取消
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 bg-sky-500 text-white text-sm rounded hover:bg-sky-600 disabled:opacity-50"
        >
          {saving ? '儲存中...' : form.id ? '更新文章' : '建立文章'}
        </button>
      </div>

      {/* form-input 樣式（scoped via style tag 避免全域污染） */}
      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
          color: #111827;
        }
        .form-input:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
        }
      `}</style>
    </div>
  )
}

interface FormFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

const FormField = ({ label, hint, children }: FormFieldProps) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}
      {hint && <span className="ml-2 text-gray-400 font-normal">{hint}</span>}
    </label>
    {children}
  </div>
)

export default AdminBlogEditor

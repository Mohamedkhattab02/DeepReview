// src/actions/articles.ts
'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { Article } from '@/types/article'

export async function getArticles(): Promise<Article[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.from('articles').select('*')
  .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getMyArticles(): Promise<Article[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getArticleById(id: string): Promise<Article | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return data
}

export async function uploadArticle(formData: FormData) {
  const supabase =await  createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  
  // Upload to Supabase Storage
  const filePath = `${user.id}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('articles')
    .upload(filePath, file)
  
  if (uploadError) throw uploadError
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('articles')
    .getPublicUrl(filePath)
  
  // Create article record
  const { data, error } = await supabase
    .from('articles')
    .insert({
      user_id: user.id,
      title,
      file_url: publicUrl,
      analysis_completed: false
    })
    .select()
    .single()
  
  if (error) throw error
  
  revalidatePath('/student')
  revalidatePath('/student/mylibrary')
  
  return data
}

export async function deleteArticle(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) throw error
  
  revalidatePath('/student')
  revalidatePath('/student/mylibrary')
}
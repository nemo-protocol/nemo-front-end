import { NextPage } from 'next'
import Link from 'next/link'

const About: NextPage = () => {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">关于我们</h1>
      <p className="mb-4">
        这是一个使用 Next.js + TypeScript + TailwindCSS 构建的示例页面。
      </p>
    </main>
  )
}

export default About

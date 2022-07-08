// @ts-ignore
import { allPosts } from "virtual:contentlayer/generated";

export function App() {
  return (
    <main>
      {allPosts.map((x: any) => <p>{x.title}</p>)}
    </main>
  )
}

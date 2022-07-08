// @ts-ignore
import { allDocuments } from "virtual:contentlayer/generated";

export const Sidebar = () => {
    return (
        <aside>
            {allDocuments.map((doc: any) => <a href="#">{doc.title}</a>)}
        </aside>
    )

}

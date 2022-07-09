// @ts-ignore
import { allDocuments } from "virtual:contentlayer/generated"

const gettingStarted = allDocuments.find((x: any) => x.title === 'Getting started')

const GettingStarted = () => {
    return (
        <section>
            <h1>{gettingStarted.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: gettingStarted.body.html }}></div>
        </section>
    )
}

export default GettingStarted

import { styled } from "goober"

const JumboTron = styled('section')`
    background: white;
    display: flex;
    justify-content: center;
`

const Home = () => {
    return (
        <div>
            <JumboTron>
                <img width="890" alt="useInteractions" src="https://user-images.githubusercontent.com/2041385/175799707-a9187ab1-97d3-45b1-b594-10c62253d4da.svg" />
            </JumboTron>
            <a href="/docs/getting-started">Getting started</a>
        </div>
    )
}

export default Home

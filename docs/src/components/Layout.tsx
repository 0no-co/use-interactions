import { styled } from 'goober'
import { VNode } from 'preact'

const Wrapper = styled('div')``

const Main = styled('main')``

export type LayoutProps = {
  children?: VNode
}

// TODO: add sidebar based on our links
const Layout = (props: LayoutProps) => (
  <Wrapper>
    <Main>{props.children}</Main>
  </Wrapper>
)

export default Layout

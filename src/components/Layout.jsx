import Nav from './Nav.jsx';
const Layout = ({children,...restProps}) => {
    return( 
        <>
            <Nav/>
            {children}
        </>
    );
}
 
export default Layout;
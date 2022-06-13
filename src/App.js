import React from 'react';
import { BrowserRouter, Switch , Route } from 'react-router-dom';
import './styles/app.scss';
import Layout from './components/Layout';
import Library from './components/Library';
import Login from './components/Login';
import Register from './components/Register';
import Forum from './components/Forum';
import Main from './components/Main';
import { SearchBarProvider, useSearchTerm } from './Context/SearchBarContext';

export default ()=> <SearchBarProvider>
    <App></App>
</SearchBarProvider>;

function App() {

  return (
      <BrowserRouter>
          <Layout>
            <Switch>
                <Route exact path="/">
                    <Main/>
                </Route>
                <Route exact path="/manga-section">
                    <Library/>
                </Route>
                <Route exact path="/login">
                    <Login/>
                </Route>
                <Route exact path="/register">
                    <Register/>
                </Route>
                <Route exact path="/forum">
                    <Forum/>
                </Route>
              </Switch>
          </Layout>
      </BrowserRouter>
  );
}


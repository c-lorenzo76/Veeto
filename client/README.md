# Client

## >> Start the client
```bash
cd client
npm install
npm run dev
```
Then check Veeto on localhost:5173

## >> Notes
> * Complete Home page:
    >   - Fix the Select component for language
    >   - Get rid of css file and add the styling into the tags
> * Complete Lobby page:
    >   -  Fix the users names it's too sloppy and all over the place: view comments left behind
> * Edit Q1 Page:
    >   - Going to have to figure out how to create rooms using websockets and then figure out how to do procedural questions for the poll. 

## React + Vite
Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

import { element, style, state, render } from '../../src/main'

const styleWrapper = style`
	& {
		background: lightgray;
		padding:30px;
	}
	&:hover {
		background: green;
		padding:30px;
	}
`

const App = element`
	<div class="${styleWrapper}">
		<p> Hello World </p>
	</div>
`

const appElement = document.getElementById("app");
if (appElement) {
    render(App, appElement);
}
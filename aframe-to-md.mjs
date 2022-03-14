import tablemark from "tablemark";
const myArgs = process.argv.slice(2);

const handler = {
	get(target, prop, receiver) {
		return function () {
			console.log(prop);
		};
	}
};

function processSchema(obj, property) {
	const out = {};
	if (property) out.property = property;
	Object.assign(out, obj);
	out.type = out.type || typeof out.default;
	if (typeof out.default === 'object') {
		out.default = JSON.stringify(out.default);
	}
	out.description = out.description || "";
	if (out.oneOf) out.description += ` One of ${out.oneOf.toString()}`;
	return out;
}

global.THREE = new Proxy({}, handler);
global.AFRAME= {
	registerComponent: function (name, details) {
		const table = [];
		if (details.schema.description) {
			const out = processSchema(details.schema);
			table.push(out);
		} else {
			for (const [property, obj] of Object.entries(details.schema)) {
				const out = processSchema(obj, property);
				table.push(out);
			}
		}
		console.log(tablemark(table));
	}
}
import(myArgs[0]);

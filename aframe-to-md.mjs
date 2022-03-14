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
	out.type = obj.type || typeof obj.default;
	out.description = obj.description || "";
	if (obj.oneOf) obj.description += ` One of ${obj.oneOf.toString()}`;
	if (typeof obj.default === 'object' || typeof obj.default === 'string') {
		out.default = JSON.stringify(obj.default);
	} else {
		out.default = obj.default;
	}
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

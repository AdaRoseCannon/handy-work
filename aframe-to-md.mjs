import tablemark from "tablemark";
const myArgs = process.argv.slice(2);

const handler = {
	get(target, prop, receiver) {
		return function () {
			console.log(prop);
		};
	}
};

global.THREE = new Proxy({}, handler);
global.AFRAME= {
	registerComponent: function (name, details) {
		const table = [];
		for (const [property, obj] of Object.entries(details.schema)) {
			const out = {};
			out.property = property;
			Object.assign(out, obj);
			out.type = out.type || typeof out.default;
			out.description = out.description || "";
			if (out.oneOf) out.description += ` One of ${out.oneOf.toString()}`;
			table.push(out);
		}
		console.log(tablemark(table));
	}
}
import(myArgs[0]);

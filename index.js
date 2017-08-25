document.addEventListener("DOMContentLoaded", evt => {
	let deck = document.querySelector(".card-container");
	let correct = document.querySelector(".game-correct");
	let skipped = document.querySelector(".game-skipped");
	let unanswered = document.querySelector(".game-unanswered");
	let normalize = function (name) {
		return name.toUpperCase().replace(/[\-\u2010]/, " ").replace(/[\'\.\u8216\u8217]/, "");
	}
	let updateTotals = function (dCorrect, dSkipped, dUnanswered) {
		[
			{
				"el": correct,
				"val": dCorrect
			},
			{
				"el": skipped,
				"val": dSkipped
			},
			{
				"el": unanswered,
				"val": dUnanswered
			}
		].forEach(tuple => {
			let num = parseInt(tuple.el.firstChild.textContent) + tuple.val;
			tuple.el.firstChild.textContent = num;
			tuple.el.style.flexGrow = num;
			if (num === 0) {
				tuple.el.firstChild.classList.add("zero");
			} else {
				tuple.el.firstChild.classList.remove("zero");
			}
		});
	}
	let scrollToActive = function () {
		let active = document.querySelector(".card-root.active");
		if (active) {
			let cardBCR = active.getBoundingClientRect();
			let cardCenter = cardBCR.left + (cardBCR.width / 2);
			let viewCenter = window.innerWidth / 2;
			delta = Math.floor(cardCenter - viewCenter);
			if (delta) {
				if (Math.abs(delta) >= 10) {
					deck.scrollLeft += delta / 10;
				} else if (Math.abs(delta) >= 1) {
					deck.scrollLeft += delta;
				}
				if (cardCenter > 0 && cardCenter < window.innerWidth) {
					active.querySelector(".card-control-answer").focus();
				}
				requestAnimationFrame(scrollToActive);
			}
		}
	};
	window.fetch("countries.json").then(response => {
		response.json().then(json => {
			let codes = Object.keys(json);
			codes.shuffle();
			let template = document.querySelector("#card-template");
			let setActive = function (el) {
				let active = document.querySelector(".card-root.active");
				if (active) {
					active.classList.remove("active");
				}
				el.classList.add("active");
				requestAnimationFrame(scrollToActive);
			}
			let prevActive = function (skip = false, loop = false) {
				let active = document.querySelector(".card-root.active");
				let prev = loop && !active.previousElementSibling ? active.parentElement.lastElementChild : active.previousElementSibling;
				if (prev) {
					setActive(prev);
					if (skip && document.querySelector(".card-root:not(.correct):not(.skipped)") && (prev.classList.contains("correct") || prev.classList.contains("skipped"))) {
						prevActive(skip, loop);
					}
				}
			}
			let nextActive = function (skip = false, loop = false) {
				let active = document.querySelector(".card-root.active");
				let next = loop && !active.nextElementSibling ? active.parentElement.firstElementChild : active.nextElementSibling;
				if (next) {
					setActive(next);
					if (skip && document.querySelector(".card-root:not(.correct):not(.skipped)") && (next.classList.contains("correct") || next.classList.contains("skipped"))) {
						nextActive(skip, loop);
					}
				}
			}
			codes.forEach(code => {
				let lang = navigator.language.toUpperCase().split("-")[0];
				let country = json[code];
				let card = template.content.cloneNode(true);
				let root = card.querySelector(".card-root");
				root.id = code;
				card.querySelector(".card-flag-image").src = "./flags/" + code.toLowerCase() + ".svg";
				let text = card.querySelector(".card-text");
				text.classList.add("hidden");
				let officialNames = country.OfficialNames;
				var localName = false;
				Object.keys(officialNames).forEach(lang => {
					if (navigator.language.toUpperCase().startsWith(lang)) {
						localName = true;
					}
					let div = document.createElement("div");
					div.classList.add("card-text-official");
					div.lang = lang.toLowerCase();
					div.textContent = officialNames[lang];
					text.appendChild(div);
				});
				let localizedNames = country.LocalizedNames;
				if (!localName) {
					let div = document.createElement("div");
					div.classList.add("card-text-localized");
					div.textContent = localizedNames[lang];
					text.appendChild(div);
				}
				let answer = card.querySelector(".card-control-answer");
				let prev = card.querySelector(".card-control-prev");
				let skip = card.querySelector(".card-control-skip");
				let next = card.querySelector(".card-control-next");
				let answers = [];
				if (localName) {
					answers.push(officialNames[lang]);
				} else {
					answers.push(localizedNames[lang]);
				}
				let shortNames = country.ShortNames;
				if (shortNames[lang]) {
					Array.prototype.push.apply(answers, shortNames[lang]);
				}
				answer.addEventListener("input", evt => {
					answers.forEach(answer => {
						if (normalize(evt.target.value) === normalize(answer)) {
							root.classList.add("correct");
							text.classList.remove("hidden");
							evt.target.value = answer;
							evt.target.disabled = true;
							skip.disabled = true;
							updateTotals(1, 0, -1);
							setTimeout(function () {
								nextActive(true, true);
							}, 1000);
						}
					});
				});
				prev.addEventListener("click", evt => prevActive());
				skip.addEventListener("click", evt => {
					root.classList.add("skipped");
					text.classList.remove("hidden");
					answer.disabled = true;
					skip.disabled = true;
					updateTotals(0, 1, -1);
					setTimeout(function () {
						nextActive(true, true);
					}, 1000);
				});
				next.addEventListener("click", evt => nextActive());
				deck.appendChild(card);
			});
			updateTotals(0, 0, codes.length);
			template.remove();
			deck.firstElementChild.querySelector(".card-control-prev").remove();
			deck.lastElementChild.querySelector(".card-control-next").remove();
			setActive(document.querySelector(".card-container .card-root"));
			window.addEventListener("resize", evt => {
				requestAnimationFrame(scrollToActive);
			});
			window.addEventListener("keydown", evt => {
				let active = document.querySelector(".card-root.active");
				let answer = active.querySelector(".card-control-answer");
				let prev = active.querySelector(".card-control-prev");
				let skip = active.querySelector(".card-control-skip");
				let next = active.querySelector(".card-control-next");
				if (evt.key === "ArrowLeft") {
					if (prev) {
						prev.dispatchEvent(new MouseEvent("click"));
					}
				} else if (evt.key === "Tab") {
					evt.preventDefault();
					if (evt.getModifierState("Shift")) {
						prevActive(true, true);
					} else {
						nextActive(true, true);
					}
				} else if (evt.key === "ArrowRight") {
					if (next) {
						next.dispatchEvent(new MouseEvent("click"));
					}
				} else if (evt.key === "Escape") {
					skip.dispatchEvent(new MouseEvent("click"));
				} else {
					answer.focus();
				}
			});
		});
	});
});
Array.prototype.shuffle = function () {
	for (var i = this.length - 1; i > 0; i -= 1) {
		let j = Math.floor(Math.random() * (i + 1))
		let temp = this[i];
		this[i] = this[j];
		this[j] = temp;
	}
}

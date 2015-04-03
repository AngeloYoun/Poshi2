YUI().ready(
	'anim',
	'aui-button',
	'aui-node',
	'event',
	'resize',
	'transition',
	function(A) {
		var currentScope;

		var divider = A.one('.pass-fail-divider');
		var lastFail = A.one('.last-fail');
		var sidebar = A.one('.sidebar');
		var xmlLog = A.one('.xml-log');

		var collapseBtns = xmlLog.all('.pending > .btn-container .btn-collapse');
		var failDivs = xmlLog.all('.fail-divider');

		var collapsePairIndex = 0;
		var passFailHeight = 0;

		var WIN = A.getWin();

		var treeToFail = lastFail.ancestors('ul');

		// formatPage();

		function formatPage() {
			var commandLog = sidebar.one('.command-log');
			var commandLine = commandLog.all('> .line');
			var commandLineArray = commandLine.get('id');
			var passedLoops = new A.NodeList();
			console.log(commandLineArray.length);

			// commandLine.each(
			//     function(node) {
			//         var lineInnerNode = node.all('.status > div');
			//         var lineContainer = lineInnerNode.item(1);

			//         lineContainer.set('className', 'line-container');
			//         var lineContent = new A.NodeList(lineContainer.getDOMNode().childNodes);

			//         var nameContainerOg = lineContent.item(1);

			//         var name = nameContainerOg.html();

			//         var hashtagIndex = name.indexOf('#');

			//         var before = name.slice(hashtagIndex + 1);
			//         var after = name.slice(0, hashtagIndex);

			//         if (before.toLowerCase() === after.toLowerCase()) {
			//             name = name.slice(0, hashtagIndex);
			//         }

			//         nameContainerOg.remove(true);

			//         var paramDef = lineContent.item(2);

			//         var paramDefString = paramDef._node.textContent.trim();

			//         var runningText = lineContent.item(0);

			//         if(lineContent.item(5)) {
			//             var value = lineContent.item(5).html();
			//             if(value) {
			//                 runningText.placeAfter(A.Node.create('<span class="value">' + value + '</span>'));
			//             }

			//             lineContent.item(5).remove(true);
			//         }

			//         if(lineContent.item(4)) {
			//             if(lineContent.item(4)._node.textContent.trim().length > 0) {
			//                 runningText.placeAfter(A.Node.create('<span class="misc"> value </span>'));
			//             }

			//             lineContent.item(4).remove(true);
			//         }

			//         if(lineContent.item(3)) {
			//             var locatorKeyOg = lineContent.item(3);

			//             var locatorKey = locatorKeyOg.html();

			//             locatorKeyOg.remove(true);

			//             runningText.placeAfter(A.Node.create('<span class="locator-key">' + locatorKey + '</span>'))
			//         }

			//         if(paramDefString.length > 0) {
			//             runningText.placeAfter(A.Node.create('<span class="misc"> ' + paramDefString + ' </span>'));
			//         }

			//         runningText.placeAfter(A.Node.create('<span class="command-name">' + name + '</span>'));
			//         runningText.placeAfter(A.Node.create('<span class="misc">Running </span>'))

			//         paramDef.remove(true);
			//         runningText.remove(true);

			//         node.append(lineInnerNode);

			//         var toDie = node.one('li');
			//         toDie.remove(true);
			//     }
			// )
			var all = xmlLog.all('*');
			var collapseId = 0;
			all.each(
				function(node) {
					if(node.html() === 'for') {
						var container = node.ancestor('li');
						if(container.hasClass('pass') && !container.hasClass('for')) {
							passedLoops.push(container);
						}
						container.addClass('for');

					}
					if(node.html() === 'echo') {
						var container = node.ancestor('li');
						container.addClass('echo');
					}
					if(node.hasClass('btn-collapse') || node.hasClass('btn-var')) {
						var attrId = 'btnLinkId-' + collapseId;
						collapseId++;
						node.attr('data-btnLinkId', attrId);
						var container = node.ancestor('li');
						if(node.hasClass('btn-collapse')) {
							container = container.one('.child-container')
						}
						else {
							container = container.one('.parameter-container');
						}
						container.attr('data-btnLinkId', attrId);
					}
					if(node.hasClass('parameter-container')) {

						var index = 0;
						var childNodes = node.all('*');
						var currentSize = childNodes.size();
						console.log(currentSize % 10 > 1)
						while (currentSize % 10 >= 1) {
							console.log(currentSize % 10)
							console.log('looping')
							var slicedNodes = childNodes.slice(index, index + 10);
							console.log(slicedNodes)
							var lineContainer = A.Node.create('<span class="line-container"></span>')
							node.append(lineContainer);
							console.log(lineContainer)
							if(slicedNodes) {
								slicedNodes.each(
									function(target) {
										lineContainer.append(target);
									}
								)
							}
							index += 11
							currentSize -= 11;
						}
						var toDie = node.all('br');
						toDie.remove(true);
						node.all('.line-container').each(
							function(line) {
								line.all('*').each(
									function(target) {
										var html = target.html();
										if (html === '&lt;' || html === '=' || html === '/&gt;') {
											target.addClass('misc');
										}
										if (html === 'var') {
											target.addClass('action-type');
										}
										if (html === 'name' || html === 'value') {
											target.addClass('tag-type');
										}
										if (target.hasClass('parameter-value')) {
											var parameterValue = target.html();
											var nameLength = parameterValue.length;
											target.html(parameterValue.slice(1, nameLength - 1));
											target.placeAfter(A.Node.create('<span class="misc quote">"</span>'));
											target.placeBefore(A.Node.create('<span class="misc quote">"</span>'));
										}
										if (target.hasClass('line-number')) {
											line.placeBefore(target);
										}
									}
								);
							}
						)
					}
				}
			)
			console.log(passedLoops);

			var executedFunctions = xmlLog.all('.function.pass, .for.pass, .echo.pass, .last-fail');
			console.log(executedFunctions)

			console.log(commandLine)

			var commandLength = commandLine.size();

			for (i = 0, ii = 0; i < commandLength; i++, ii++) {
				var line = commandLine.item(i);
				var commandId = line.one('.command-name').html();
				while (commandId === 'IsElementPresent') {
					i++
					line = commandLine.item(i);
					commandId = line.one('.command-name').html();
				}
				var functionNode = executedFunctions.item(ii);

				// if(functionNode.hasClass('echo')) {
				//     commandId = commandId.slice(15);
				//     commandId = commandId.slice(0, commandId.length - 1);
				// }

				// if(functionNode.hasClass('for')) {
				//     ii++
				//     functionNode = executedFunctions.item(ii);
				// }
				var functionClass = ('functionLinkId-' + ii);

				// console.log(commandId + ' / ' + functionNode.one('.line-container > .name').html())

				if (functionNode.hasClass('for')) {
					var loopPattern = [];
					looping = true;
					loopedFunctions = functionNode.all('.function.pass');
					console.log('loop encountered @ ' + ii)
					var k = ii;
					loopedFunctions.each(
						function (node) {
							var nodeName = node.one('.line-container > .name').html();
							var loopedFunctionClass = ('functionLinkId-' + ii)
							loopPattern.push(nodeName);
							node.attr('data-functionLinkId', loopedFunctionClass)
							ii++;
						}
					)
					console.log(loopPattern)
					var patternLength = loopPattern.length;
					var looping = true;
					while(looping) {
						for (j = 0; j < patternLength; j++) {
							var checkLine = commandLine.item(i + j);

							if (loopPattern[j] == checkLine.one('.command-name').html()) {
								functionClass = ('functionLinkId-' + (k + j));
								console.log(checkLine.one('.command-name').html() + (k + j));
								checkLine.addClass('linkable');
								checkLine.attr('data-functionLinkId', functionClass);

							}
							else {
								looping = false;
								break;
							}
						}
						if(looping) {
							i += patternLength;
						}
					}
				}
				else {
					functionNode.attr('data-functionLinkId', functionClass);
					line.attr('data-functionLinkId', functionClass);
					line.addClass('linkable');
				}
			}
		}

		init();

		function init() {

			expandTree(lastFail);

			sidebar.delegate(
				'click',
				linkFunction,
				'.linkable'
			)

			xmlLog.delegate(
				'click',
				collapseToggle,
				'.btn-collapse'
			);

			xmlLog.delegate(
				'click',
				collapseToggle,
				'.btn-var'
			);

			xmlLog.delegate(
				'mouseenter',
				scopeHover,
				testScopeable,
				null,
				true
			);

			xmlLog.delegate(
				'mouseleave',
				scopeHover,
				testScopeable,
				null,
				false
			);

			xmlLog.delegate(
				'click',
				scopeSelect,
				testScopeable
			);

			var treeBtn = sidebar.one('.btn-tree');

			treeBtn.on(
				'click',
				function(event) {
					var currentTarget = event.currentTarget;

					var commandLog = sidebar.one('.command-log');

					currentTarget.toggleClass('toggle');


					if (currentTarget.hasClass('toggle')) {
						sidebar.setStyle('width', '40%');
						xmlLog.setStyle('width', '60%');

						commandLog.toggleClass('hidden')

						commandLog.transition(
							{
								height: {
									duration: 0.5,
									easing: 'ease-out',
									value: WIN.height()
								}
							},
							function() {
								commandLog.setStyle('height', '100%');
							}
						);
					}
					else {
						sidebar.setStyle('width', '20%');
						xmlLog.setStyle('width', '80%');

						commandLog.setStyle('height', commandLog.innerHeight())

						commandLog.transition(
							{
								height: {
									duration: 0.5,
									easing: 'ease-out',
									value: 0
								}
							},
							function() {
								commandLog.toggleClass('hidden');
							}
						);
					}


					commandLog.toggleClass('toggle');

					var body = A.one('body');

					body.toggleClass('tree');
				}
			);

			var sidebarBtn = sidebar.one('.btn-sidebar');
			sidebarBtn.on(
				'click',
				function(event) {
					var currentTarget = event.currentTarget;

					if (currentTarget.hasClass('toggle')) {
						sidebar.setStyle('transform', 'translateX(0%)');
						xmlLog.setStyle('width', '80%');
					}
					else {
						sidebar.setStyle('transform', 'translateX(100%)');
						xmlLog.setStyle('width', '100%');
					}
					currentTarget.toggleClass('toggle');
				}
			);

			var errorBtns = xmlLog.all('.error-btn');

			errorBtns.on(
				'click',
				function(event) {
					var currentTarget = event.currentTarget;

					var container = currentTarget.ancestor('li');

					if (container) {
						var errorConsole = container.one('.console');

						if (errorConsole) {
							errorConsole.toggleClass('hidden');
						}
					}
				}
			);

			var screenshotBtns = A.all('.screen-shot-btn');

			screenshotBtns.on(
				'click',
				function(event) {
					var currentTarget = event.currentTarget;

					var container = currentTarget.ancestor('li');

					if (container) {
						var screenshots = container.one('.screenshots');

						if (screenshots) {
							screenshots.toggleClass('hidden');
						}
					}
				}
			);

			var scroll = scrollToNode(lastFail);

			scroll.run();
		}

		function expandTree(node) {
			var tree = node.ancestors('.child-container');

			tree.each(
				function(target) {
					if (target.hasClass('collapsed')) {
						collapseToggle(null, target);
					}
				}
			);
		}

		// function stopPropagation(node) {
		// 	node.on(
		// 		['click', 'mouseenter', 'mouseleave'],
		// 		function(event) {
		// 			event.stopPropagation();
		// 		}
		// 	)
		// }

		function recalculateHeights() {
			failDivs.each(
				function(node) {
					var lineContainer = node.next();

					var newHeight = lineContainer.outerHeight();

					node.setStyle('height', newHeight);
				}
			);
		}

		var isRunning = null;
		var newExpandHeight;

		function resetDividerHeight(newHeight, node) {
			if ((passFailHeight === 0) || (node.getY() <= passFailHeight)) {
				var isPending = false;

				var firstClosedLi = lastFail;
				var newDivider;

				for (var i = 1; i < treeToFail.size(); i++) {
					var target = treeToFail.item(i);

					if (node === target) {
						isPending = true;
					}

					if (target.getStyle('display') == 'none') {
						firstClosedLi = target.previous();

						break;
					}
				}

				var lineContainer = node.previous();

				if (newHeight === 0) {
					if (isPending) {
						var containerY = lineContainer.getY();
						var containerHeight = lineContainer.outerHeight();

						passFailHeight = (containerY + containerHeight);
					}
					else {
						if(!isRunning) {
							passFailHeight -= node.outerHeight();
						}
					}

					newExpandHeight = passFailHeight;
					divider.setStyle('height', passFailHeight);
				}
				else {
					if (isPending) {
						var firstClosedLiY = firstClosedLi.getY();
						var firstClosedLiHeight = firstClosedLi.outerHeight();

						newExpandHeight = (firstClosedLiY + firstClosedLiHeight);
					}
					else {
						newExpandHeight += newHeight;
					}
				divider.setStyle('height', newExpandHeight);
				}

				recalculateHeights();
			}
		}

		function linkFunction(event) {
			var currentTarget = event.currentTarget;

			var linkedFunction = getLink(currentTarget, 'li', 'data-functionLinkId', xmlLog);

			linkedFunction.toggleClass('linked');

			expandTree(linkedFunction);

			var scroll = scrollToNode(linkedFunction);

			scroll.run();
		}

		function collapseToggle(event, collapseContainer) {
			var collapseBtn

			if (!collapseContainer) {
				collapseBtn = event.currentTarget;
				collapseContainer = getLink(collapseBtn, '.collapsible', 'data-btnLinkId', xmlLog);
			}
			else {
				collapseBtn = getLink(collapseContainer, '.btn', 'data-btnLinkId', xmlLog);
			}

			collapseTransition(collapseContainer);
			collapseBtn.toggleClass('toggle');
		}


		function collapseTransition(targetNode) {

			if (targetNode) {

				if (targetNode.getStyle('height') != '0px') {
					if(isRunning === targetNode || !isRunning) {
						console.log('fired')
						var newHeight = targetNode.outerHeight();

						var transDuration = (Math.pow(newHeight, 0.35) / 15);

						targetNode.setStyle('height', newHeight);

						targetNode.transition(
							{
								height: {
									duration: transDuration,
									easing: 'ease-out',
									value: 0
								},
								on: {
									start: resetDividerHeight(0, targetNode)
								}
							},
							function() {
								isRunning = null;
								this.addClass('collapsed');
							}
						);
					}
				}
				else {
					var lastChild = targetNode.getDOMNode().lastElementChild;

					lastChild = A.Node(lastChild);

					targetNode.removeClass('collapsed');

					var lastChildY = lastChild.getY();
					var lastChildHeight = lastChild.innerHeight();

					var lastChildBottomY = lastChildY + lastChildHeight + 1;

					var newHeight = (lastChildBottomY - targetNode.getY());

					var transDuration = (Math.pow(newHeight, 0.35) / 15);

					isRunning = targetNode;

					targetNode.transition({
							height: {
								duration: transDuration,
								easing: 'ease-in',
								value: newHeight
							},
							on: {
								start: resetDividerHeight(newHeight, targetNode)
							}
						},
						function() {
							this.setStyle('height', 'auto');

							passFailHeight = newExpandHeight;

							isRunning = null;
						}
					);
				}
			}
		}

		function getLink(node, selector, attrName, scope) {
			linkId = node.attr(attrName);
			if (!scope) {
				scope = A;
			}
			return scope.one(selector + '[' + attrName + '=' + linkId + ']');
		}

		function scopeHover(event, enter) {
			var currentTarget = event.currentTarget;
			var target = event.target;

			if (testClickable(target)) {
				currentTarget.toggleClass('scoped', enter);

				var node = currentTarget.ancestor('.macro');

				if (enter) {
					node = currentTarget.ancestors('.macro');
				}

				if (node) {
					node.toggleClass('scoped', !enter);
				}

				event.stopPropagation();
			}
		}

		function scopeSelect(event) {
			var scope = event.currentTarget;
			var target = event.target;

			if (testClickable(target)) {

				if (currentScope) {
					currentScope.removeClass('current-scope');
				}

				currentScope = scope;
				scopeSidebar();
				scope.addClass('current-scope');
				event.stopPropagation();
			}
		}

		function scopeSidebar() {
			if (currentScope) {
				var sidebarScopeName = sidebar.one('.scope-type .scope-name');
				var sidebarScopeTitle = sidebar.one('.scope-type .title');
				var sidebarParameterList = sidebar.one('.parameter .parameter-list');

				var scopeNames = currentScope.all('> .line-container .name');
				var scopeTypes = currentScope.all('> .line-container .tag-type');

				var scopeName = scopeNames.item(0).html();
				var scopeType = scopeTypes.item(0).html();

				sidebarScopeName.html(scopeName);
				sidebarScopeTitle.html(scopeType);

				sidebarParameterList.all('> *').remove();

				if (scopeType === 'macro') {
					var parameters = currentScope.all('> .line-container .parameter-container .parameter-value');

					var parameterCount = parameters.size();

					for(i = 0; i < parameterCount; i += 2) {
						sidebarParameterList.append(A.Node.create('<li class="parameter-name">' + parameters.item(i).html() + '</div>'));
						sidebarParameterList.append(A.Node.create('<li class="parameter-value">' + parameters.item(i + 1).html() + '</div>'));
					}
				}
				else if (scopeType === 'function') {
					var parameterCount = (scopeNames.size() - 1);

					for(i = 1; i <= parameterCount; i++) {
						sidebarParameterList.append(A.Node.create('<li class="parameter-name">' + scopeTypes.item(i).html() + '</div>'));
						sidebarParameterList.append(A.Node.create('<li class="parameter-value">' + scopeNames.item(i).html() + '</div>'));
					}
				}
			}
		}

		function scrollToNode(node) {
			var winHalf = (WIN.height() / 2);

			var halfNodeHeight = (node.innerHeight() / 2);

			var offset = (winHalf - halfNodeHeight);

			var yWindowOffset = WIN.getDOMNode().pageYOffset;

			var yDistance = (node.getY() - offset);

			return new A.Anim(
				{
					duration: 2,
					easing: 'easeOutStrong',
					node: WIN,
					to: {
						scroll: [0, yDistance]
					}
				}
			);
		}

		function testClickable(testNode) {
			return !testNode.test('.btn, .btn-container, polygon, svg');
		}

		function testScopeable(testNode) {
			return testNode.hasClass('macro') || testNode.hasClass('function');
		}
	}
);
YUI.add(
	'liferay-qa-poshi-logger',
	function(A) {
		var Lang = A.Lang;

		var BODY = A.getBody();
		var WIN = A.getWin();

		var PoshiLogger = A.Component.create({

			NAME: 'poshilogger',

			ATTRS: {
				currentScope: {
					setter: A.one
				},

				commandLogId: {
					value: null
				},

				commandLogScope: {
					value: new A.NodeList()
				},

				fails: {
					setter: function() {
						var instance = this;

						var xmlLog = instance.get('xmlLog');

						return xmlLog.all('.fail');
					}
				},

				prevNode: {
					setter: A.one
				},

				running: {
					value: null
				},

				sidebar: {
					setter: A.one
				},

				status: {
					validator: Lang.isArray,
					value: ['fail', 'pass', 'pending']
				},

				xmlLog: {
					setter: A.one
				}
			},

			prototype: {
				bindUI: function() {
					var instance = this;

					instance.bindSidebar();
					instance.bindXMLLog();
				},

				renderUI: function() {
					var instance = this;

					var xmlLog = instance.get('xmlLog');
					var sidebar = instance.get('sidebar');

					var commandLog = sidebar.one('.command-log');

					xmlLog.toggleClass('running');

					instance.toggleCommandLog(commandLog);

					if (!xmlLog.hasClass('running')) {
						instance.minimizeSidebar();
					}
				},

				bindSidebar: function() {
					var instance = this;

					var sidebar = instance.get('sidebar');

					sidebar.delegate(
						'click',
						A.bind('handleCurrentCommandSelect', instance),
						'.linkable .line-container'
					);

					sidebar.delegate(
						'click',
						A.rbind('handleToggleCollapseBtn', instance, true),
						'.expand-toggle'
					);

					var logBtn = sidebar.all('.btn-command-log');

					logBtn.on('click', A.bind('handleToggleCommandLogBtn', instance));

					var sidebarBtn = sidebar.one('.btn-sidebar');

					sidebarBtn.on('click', A.bind('handleMinimizeSidebarBtn', instance));

					var jumpToError = sidebar.one('.btn-jump-to-error');

					jumpToError.on('click', A.bind('handleGoToErrorBtn', instance));

				},

				bindXMLLog: function() {
					var instance = this;

					var xmlLog = instance.get('xmlLog');

					xmlLog.delegate(
						'mouseover',
						A.bind('handleXmlNodeHover', instance),
						'.function, .macro, .test-group'
					);

					xmlLog.delegate(
						'click',
						A.bind('handleCurrentScopeSelect', instance),
						'.function, .macro, .test-group'
					);

					xmlLog.delegate(
						'click',
						A.bind('handleFullScreenImageClick', instance),
						'.screenshot-container img, .fullscreen-image'
					);

					xmlLog.delegate(
						'click',
						A.rbind('handleToggleCollapseBtn', instance, false),
						'.btn-collapse, .btn-var'
					);

					xmlLog.delegate(
						'click',
						A.bind('handleErrorBtns', instance),
						'.error-btn, .screenshot-btn'
					);
				},

				_clearXmlErrors: function(command) {
					command.all('.errorPanel').remove(true);

					var btnContainer = command.one('.btn-container');

					btnContainer.one('.screenshot-btn').remove(true);
					btnContainer.one('.error-btn').remove(true);
				},

				collapseTransition: function(targetNode) {
					var instance = this;

					var returnVal = false;

					var running = instance.get('running');

					if (targetNode && (!running || !running.contains(targetNode))) {
						var height;

						var collapsing = (targetNode.getStyle('height') != '0px');

						if (collapsing) {
							height = targetNode.outerHeight();

							targetNode.setStyle('height', height);

							instance.set('running', targetNode);

							targetNode.addClass('transitioning');
						}
						else {
							var lastChild = targetNode.getDOMNode().lastElementChild;

							lastChild = A.Node(lastChild);

							targetNode.removeClass('collapse');
							targetNode.addClass('transitioning');

							var lastChildY = lastChild.getY();
							var lastChildHeight = lastChild.innerHeight();

							var lastChildBottomY = (lastChildY + lastChildHeight + 1);

							height = (lastChildBottomY - targetNode.getY());
						}

						instance._getTransition(targetNode, height, collapsing);

						returnVal = true;
					}

					return returnVal;
				},


				_getTransition: function(targetNode, height, collapsing) {
					var instance = this;

					var duration = (Math.pow(height, 0.35) / 15);

					var ease = 'ease-in';

					if (collapsing) {
						ease = 'ease-out';

						height = 0;
					}

					targetNode.transition(
						{
							height: {
								duration: duration,
								easing: ease,
								value: height
							}
						},
						function() {
							if (collapsing) {
								targetNode.addClass('collapse');
							}
							else {
								targetNode.setStyle('height', 'auto');
							}

							instance.set('running', null);

							targetNode.removeClass('transitioning');
						}
					);
				},

				displayNode: function(node) {
					var instance = this;

					node = node || instance.get('fails').last();

					var parentContainers = node.ancestors('.child-container');

					if (parentContainers) {
						instance._expandParentContainers(parentContainers, node);
					}
				},

				_expandParentContainers: function(parentContainers, node) {
					var instance = this;

					var timeout = 0;

					var container = parentContainers.shift();

					if (container.hasClass('collapse')) {
						instance._toggleContainer(container, false);
						instance._scrollToNode(container.one('.line-group'));
						timeout = 200;
					}

					if (parentContainers.size()) {
						setTimeout(
							A.bind('_expandParentContainers', instance, parentContainers, node),
							timeout
						);
					}
					else {
						instance._scrollToNode(node);
					}
				},

				getSidebarLogNode: function(logId) {
					var instance = this;

					logId = logId || instance.get('commandLogId');

					var sidebar = instance.get('sidebar');

					return sidebar.one('.command-log[data-logId="' + logId + '"]');
				},

				handleCurrentScopeSelect: function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					event.stopPropagation()

					if (!event.target.test('.btn, .btn-container')) {
						instance.displayNode(currentTarget);

						instance.selectCurrentScope(currentTarget);
					}
				},

				handleErrorBtns: function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					currentTarget.toggleClass('toggle');

					var xmlLog = instance.get('xmlLog');

					var errorLinkId = currentTarget.attr('data-errorLinkId');

					var errorPanel = xmlLog.one('.errorPanel[data-errorLinkId="' + errorLinkId + '"]');

					if (errorPanel) {
						errorPanel.toggleClass('toggle');
					}
				},

				handleCurrentCommandSelect: function(event) {
					var instance = this;

					var xmlLog = instance.get('xmlLog');

					var currentTargetAncestor = event.currentTarget.ancestor();

					if (currentTargetAncestor) {
						instance._parseCommandLog(currentTargetAncestor, true);

						var functionLinkId = currentTargetAncestor.attr('data-functionLinkId');

						var linkedFunction = xmlLog.one('.line-group[data-functionLinkId="' + functionLinkId + '"]');

						instance.displayNode(linkedFunction);

						instance.selectCurrentScope(linkedFunction);
					}
				},

				handleFullScreenImageClick: function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					var src = currentTarget.attr('src');

					var fullScreenImage = A.one('.fullscreen-image');

					if (fullScreenImage.hasClass('toggle')) {
						fullScreenImage.append(A.Node.create('<img alt="fullscreen screenshot" src="' + src + '">'));
					}
					else {
						fullScreenImage.one('*').remove(true);
					}

					fullScreenImage.toggleClass('toggle');
				},

				handleGoToErrorBtn: function(event) {
					var instance = this;

					instance.displayNode();
				},

				handleXmlNodeHover: function(event) {
					var instance = this;

					event.stopPropagation();

					var prevNode = instance.get('prevNode');

					if (prevNode) {
						prevNode.removeClass('hover');
					}

					var currentTarget = event.currentTarget;

					currentTarget.addClass('hover');

					instance.set('prevNode', currentTarget);
				},

				handleToggleCommandLogBtn: function(event) {
					var instance = this;

					var sidebar = instance.get('sidebar');

					var currentTarget = event.currentTarget;

					var logId = currentTarget.attr('data-logId');

					var commandLog = instance.getSidebarLogNode(logId);

					instance.toggleCommandLog(commandLog, currentTarget);
				},

				handleToggleCollapseBtn: function(event, inSidebar) {
					var instance = this;

					var currentTarget = event.currentTarget;

					var lookUpScope = instance.get('xmlLog');

					var linkId = currentTarget.attr('data-btnLinkId');

					if (inSidebar) {
						lookUpScope = instance.get('sidebar');
					}

					var collapsibleNode = lookUpScope.one('.child-container[data-btnLinkId="' + linkId + '"]');

					instance._toggleContainer(collapsibleNode, inSidebar);
				},

				handleMinimizeSidebarBtn:function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					instance.minimizeSidebar(currentTarget);
				},

				_injectXmlError: function(command) {
					var instance = this;

					var consoleLog = command.one('.console');
					var screenshot = command.one('.screenshots');

					var functionLinkId = command.attr('data-functionLinkId');

					var failedFunction = instance.get('xmlLog').one('.line-group[data-functionLinkId="' + functionLinkId + '"]');

					if (consoleLog && screenshot && failedFunction) {
						var btnContainer = failedFunction.one('.btn-container');

						var imgBefore = screenshot.one('.before');
						var imgAfter = screenshot.one('.after');

						var screenshotError = screenshot.attr('data-errorLinkId')
						var consoleError = consoleLog.attr('data-errorlinkid');

						btnContainer.append(A.Node.create('<button class="btn screenshot-btn" data-errorlinkid="' + screenshotError + '"><div class="btn-content"></div></button>'));
						btnContainer.append(A.Node.create('<button class="btn error-btn" data-errorlinkid="' + consoleError + '"><div class="btn-content"></div></button>'));

						failedFunction.prepend(screenshot.clone());
						failedFunction.append(consoleLog.clone());
					}
				},

				_toggleXmlLogClasses: function(logId) {
					var instance = this;

					var status = instance.get('status');

					var selector = 'data-status' + logId;

					for (var i = 0; i < status.length; i++) {
						var currentStatus = status[i];

						var currentStatusNodes = A.all('[' + selector + '="' + currentStatus + '"]');

						currentStatusNodes.toggleClass(currentStatus);
					}
				},

				_setXmlNodeClass: function(node) {
					var instance = this;

					var status = instance.get('status');

					var selector = 'data-status' + instance.get('commandLogId');

					var currentStatus = node.attr(selector);

					for (var i = 0; i < status.length; i++) {
						node.removeClass(status[i]);
					}

					node.addClass(currentStatus);
				},

				selectCurrentScope: function(node) {
					var instance = this;

					var currentScope = instance.get('currentScope');

					if (currentScope) {
						currentScope.removeClass('current-scope');
					}

					node.addClass('current-scope');

					instance.set('currentScope', node);

					if (instance.get('commandLogId')) {
						instance._parseCommandLog(node);
					}

					instance._refreshEditMenu();
				},

				minimizeSidebar: function(button) {
					var instance = this;

					var contentBox = instance.get('contentBox');

					var button = button || instance.get('sidebar').one('.btn-sidebar')

					contentBox.toggleClass('minimized-sidebar')

					button.toggleClass('toggle');
				},

				_parseCommandLog: function(node) {
					var instance = this;

					var commandLogScope = instance.get('commandLogScope');

					if (commandLogScope) {
						commandLogScope.removeClass('current-scope');
					}
					instance.set('commandLogScope', new A.NodeList());

					if (node.hasClass('macro')) {
						var macroScope = node.all('[data-functionLinkId]');

						macroScope.each(instance._scopeCommandLog, instance);
					}
					else {
						instance._scopeCommandLog(node);
					}

					var commandLogScope = instance.get('commandLogScope');

					instance._scrollToNode(commandLogScope.first(), true);
				},

				_scopeCommandLog: function(node) {
					var instance = this;

					var buffer = [];

					if (node) {
						var sidebar = instance.get('sidebar');

						var functionLinkId = node.attr('data-functionLinkId');

						node = sidebar.all('.linkable[data-functionLinkId="' + functionLinkId + '"]');

						while(node.size()) {
							var lastEl = node.pop();

							buffer.push(lastEl);
						}
					}

					var commandLogScope = instance.get('commandLogScope');

					commandLogScope = commandLogScope.concat(buffer);

					instance.set('commandLogScope', commandLogScope);

					commandLogScope.addClass('current-scope');
				},

				_scrollToNode: function(node, inSidebar) {
					var instance = this;

					var scrollNode = WIN;

					if (node) {
						node = node.one('> .line-container');

						var halfNodeHeight = (node.innerHeight() / 2);
						var halfWindowHeight = (WIN.height() / 2);

						var offsetHeight = (halfWindowHeight - halfNodeHeight);

						var nodeY = node.getY();

						if (inSidebar) {
							var commandLogId = instance.get('commandLogId');
							var sidebar = instance.get('sidebar');

							scrollNode = instance.getSidebarLogNode();

							var dividerLine = scrollNode.one('.divider-line');

							if (dividerLine) {
								nodeY = (nodeY - dividerLine.getY());
							}
						}

						var yDistance = (nodeY - offsetHeight);

						new A.Anim(
							{
								duration: 2,
								easing: 'easeOutStrong',
								node: scrollNode,
								to: {
									scroll: [0, yDistance]
								}
							}
						).run();
					}
				},

				toggleCommandLog: function(commandLog, button) {
					var instance = this;

					var commandLogId = instance.get('commandLogId');
					var sidebar = instance.get('sidebar');

					var logId = commandLog.attr('data-logId');

					button = button || sidebar.one('.btn-command-log[data-logId="' + logId + '"]');

					button.toggleClass('toggle');

					if (commandLogId !== logId) {
						if (commandLogId) {
							var currentActiveLog = instance.getSidebarLogNode();

							instance.toggleCommandLog(currentActiveLog);
						}
						instance.set('commandLogId', logId);

						var commandFailures = commandLog.all('.failed');

						commandFailures.each(instance._injectXmlError, instance)
					}
					else {
						instance.set('commandLogId', null);

						fails = instance.get('xmlLog').all('.fail');

						if (fails.size()) {
							fails.each(instance._clearXmlErrors);
						}
					}

					instance._toggleXmlLogClasses(logId);

					instance.set('fails');

					instance._transitionCommandLog(commandLog);

					var fails = instance.get('fails');

					if (fails.size()) {
						fails.each(instance.displayNode, instance);

						instance.selectCurrentScope(fails.first());
					}
				},

				_toggleContainer: function(collapsibleContainer, inSidebar) {
					var instance = this;

					var lookUpScope = instance.get('xmlLog');

					if (inSidebar) {
						lookUpScope = instance.get('sidebar');
					}

					var linkId = collapsibleContainer.attr('data-btnLinkId');

					collapsibleBtn = lookUpScope.one('.btn[data-btnLinkId="' + linkId + '"]');

					var collapsed = instance.collapseTransition(collapsibleContainer);

					if (collapsed) {
						collapsibleBtn.toggleClass('toggle');
					}
				},

				_transitionCommandLog: function(commandLog) {
					var instance = this;

					var newHeight = 0;

					var commandLogId = instance.get('commandLogId');
					var sidebar = instance.get('sidebar');

					commandLog.toggleClass('collapse');

					instance.get('contentBox').toggleClass('command-logger')

					var lastChildLog = commandLog.one('.line-group:last-child');

					if (lastChildLog && lastChildLog.hasClass('collapse')) {
						instance._toggleContainer(lastChildLog, true);
					}

					var commandLogScope = instance.get('commandLogScope');

					if (commandLogScope && commandLogId) {
						instance._scrollToNode(commandLogScope.first(), true);
					}
				},

				_refreshEditMenu: function() {
					var instance = this;

					var currentScope = instance.get('currentScope');

					if (currentScope) {
						var sidebar = instance.get('sidebar');

						var sidebarParameterTitle = sidebar.one('.parameter .title');
						var sidebarParameterList = sidebar.one('.parameter .parameter-list');

						var scopeNames = currentScope.all('> .line-container .name');
						var scopeTypes = currentScope.all('> .line-container .tag-type');

						var scopeName = scopeNames.first();
						var scopeType = scopeTypes.first();

						if (scopeName) {
							scopeName = scopeName.html();
						}
						else {
							scopeName = currentScope.one('.testCaseCommand');

							if (scopeName) {
								scopeName = scopeName.html();
							}
						}

						if (scopeType && (scopeType.html() != 'name')) {
							scopeType = scopeType.html();
						}
						else {
							scopeType = currentScope.one('> .line-container .action-type');

							if (scopeType) {
								scopeType = scopeType.html();
							}
							else {
								scopeType = 'test-case'
							}
						}

						var sidebarScopeName = sidebar.one('.scope-type .scope-name');
						var sidebarScopeTitle = sidebar.one('.scope-type .title');

						sidebarScopeName.html(scopeName);
						sidebarScopeTitle.html(scopeType);

						sidebarParameterList.all('> *').remove(true);

						var parameterCount;

						sidebarParameterTitle.removeClass('hidden');

						if (scopeType === 'macro') {
							var parameters = currentScope.all('> .line-container .parameter-container .parameter-value');

							parameterCount = parameters.size();

							for (var i = 0; i < parameterCount; i += 2) {
								sidebarParameterList.append(A.Node.create('<li class="parameter-name">' + parameters.item(i).html() + '</div>'));
								sidebarParameterList.append(A.Node.create('<li class="parameter-value">' + parameters.item(i + 1).html() + '</div>'));
							}
						}
						else if (scopeType === 'function') {
							parameterCount = (scopeNames.size() - 1);

							for (var i = 1; i <= parameterCount; i++) {
								sidebarParameterList.append(A.Node.create('<li class="parameter-name">' + scopeTypes.item(i).html() + '</div>'));
								sidebarParameterList.append(A.Node.create('<li class="parameter-value">' + scopeNames.item(i).html() + '</div>'));
							}
						}
						else {
							sidebarParameterTitle.addClass('hidden');
						}
					}
				},

				handleCommandCompleted: function(id) {
					console.log('test' + id);
					var instance = this;

					var commandLog = instance.get('sidebar').one('.command-log[data-logId="' + instance.get('commandLogId') +'"]');
					var latestCommand = commandLog.one('.line-group:last-child');

					if (latestCommand) {
						instance._parseCommandLog(latestCommand, true);

						var linkedFunction = instance.get('xmlLog').one('#' + id);

						instance.displayNode(linkedFunction);

						instance.selectCurrentScope(linkedFunction);

						instance._setXmlNodeClass(linkedFunction);
					}
					if (latestCommand.hasClass('failed')) {
						var latestFailure = latestCommand;

						instance._injectXmlError(latestFailure);
					}
				},

				handleLineCompleted: function(id) {
					console.log('test' + id);
					var instance = this;

					var linkedLine = instance.get('xmlLog').one('#' + id);

					instance._setXmlNodeClass(linkedLine);

					var container = linkedLine.one('> .child-container');

					if (container && !container.hasClass('collapse')) {
						instance._toggleContainer(container, false);
					}
				}

				handleLineStarted: function(id) {
					console.log('test' + id);
					var instance = this;

					var linkedLine = instance.get('xmlLog').one('#' + id);

					instance._setXmlNodeClass(linkedLine);

					var container = linkedLine.one('> .child-container');

					if (container && container.hasClass('collapse')) {
						instance._toggleContainer(container, false);
					}
					instance._scrollToNode(linkedLine);
				},
			}
		});

		A.PoshiLogger = PoshiLogger;
	},
	'',
	{
		requires: ['aui-component', 'anim', 'aui-base', 'aui-node', 'event', 'resize', 'transition', 'widget']
	}
);
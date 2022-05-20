angular.module('mainApp', [])
  .controller('mainController', ['$scope', '$interval', function($scope, $interval) {	

	var board;

	$scope.boardSize = "boardSizeBeg";
	$scope.boardSizeCus_width = 8;
	$scope.boardSizeCus_height = 8;
		
	$scope.mines = 0;
	$scope.bbbv = 1;
	$scope.hasResult = false;
	$scope.zini = "??";
	$scope.zini_title = "Left clicks: 0<br/>Right clicks: 0<br/>Chords: 0";
	$scope.eff = "??";
	$scope.eff_title = "??";
	var zini_path = [];
	
	$scope.ziniLoopType = "ziniLoopCountDynamic";
	$scope.ziniLoopCountFixed = 3;
	$scope.tileSize = "24";	
	$scope.displaySpeed = 600;
	$scope.highlightPath = true;
	$scope.highlightMines = true;
	
	$scope.isPlaying = false;
	$scope.currentStep = 0;
	$scope.replay_progress = 0;
	$scope.replay_tooltip = {show:false,left:0,text:""};
	$scope.replay_cursor = {left:0,top:0,opacity:0};
	
	$scope.width = 0;
	$scope.height = 0;
	$scope.cells = [];
	
	$scope.boardWidthPx = 100;
	$scope.boardHeightPx = 100;
	$scope.boardScrollPx_EditorX = 0;
	$scope.boardScrollPx_EditorY = 0;
	$scope.boardScrollPx_ResultX = 0;
	$scope.boardScrollPx_ResultY = 0;
	$scope.editorConter = {"d4":0,"d3":0,"d2":0,"d1":0};
	$scope.resultConter = {"d4":0,"d3":0,"d2":0,"d1":0};
	
	
	$scope.check_boardSizeCus_width = function() {
		if (isNaN($scope.boardSizeCus_width))
			$scope.boardSizeCus_width = 8;
		$scope.boardSizeCus_width = Math.round($scope.boardSizeCus_width);
		if ($scope.boardSizeCus_width < 1) $scope.boardSizeCus_width = 1;
		if ($scope.boardSizeCus_width > 80) $scope.boardSizeCus_width = 80;
	};
	
	$scope.check_boardSizeCus_height = function() {
		if (isNaN($scope.boardSizeCus_height))
			$scope.boardSizeCus_height = 8;
		$scope.boardSizeCus_height = Math.round($scope.boardSizeCus_height);
		if ($scope.boardSizeCus_height < 1) $scope.boardSizeCus_height = 1;
		if ($scope.boardSizeCus_height > 80) $scope.boardSizeCus_height = 80;
	};
	
	$scope.check_ziniLoopCountFixed = function() {
		if (isNaN($scope.ziniLoopCountFixed))
			$scope.ziniLoopCountFixed = 3;
		$scope.ziniLoopCountFixed = Math.round($scope.ziniLoopCountFixed);
		if ($scope.ziniLoopCountFixed < 1) $scope.ziniLoopCountFixed = 1;
		if ($scope.ziniLoopCountFixed > 10000) $scope.ziniLoopCountFixed = 10000;
	};
	
	$scope.check_displaySpeed = function() {
		if (isNaN($scope.displaySpeed))
			$scope.displaySpeed = 600;
		$scope.displaySpeed = Math.round($scope.displaySpeed/50.0)*50;
		if ($scope.displaySpeed < 50) $scope.displaySpeed = 50;
		if ($scope.displaySpeed > 5000) $scope.displaySpeed = 5000;
	};
	
	function setQueryString() {
		var url = new URLSearchParams();
		
		switch ($scope.boardSize)
		{
			case "boardSizeBeg":
				url.set('b',1);
				break;
			case "boardSizeInt":
				url.set('b',2);
				break;
			case "boardSizeExp":
				url.set('b',3);
				break;
			case "boardSizeCus":
				url.set('b',$scope.boardSizeCus_width.toString().padStart(2,"0") + $scope.boardSizeCus_height.toString().padStart(2,"0"));
				break;
		}
		if ($scope.mines != 0)
		{
			url.set('m',getMinesString());
		}
		const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + url.toString();
		window.history.pushState({ path: newUrl }, "", newUrl);
	}
	
	function getMinesString() {
		var result = '';
		
		for (var i=0 ; i< $scope.cells.length ; i+=5)
		{
			var tempN = 0;
			for (var j=i ; j<i+5 ; j++)
			{
				if (j >= $scope.cells.length)
					tempN *= 2;
				else if ($scope.cells[j].number != -1)
					tempN *= 2;
				else
				{
					tempN *= 2;
					tempN++;
				}
			}
			result += tempN.toString(32);
		}
		return result;
	}
	
	function setByMinesString(s) {
		
		for (var i=0 ; i< $scope.cells.length ; i+=5)
		{
			var tempN = parseInt(s.charAt(i/5),32);
			
			if (isNaN(tempN))
				continue;
			
			for (var j=i+4 ; j>=i ; j--)
			{
				if (j >= $scope.cells.length)
				{
					tempN >>= 1;
					continue;
				}
				
				$scope.mines += (tempN & 1);
				$scope.cells[j].number = -(tempN & 1);
				tempN >>= 1;
			}			
		}
	}
	
	$scope.newBoard = function() {
		
		switch ($scope.boardSize)
		{
			case "boardSizeBeg":
				$scope.width = 9;
				$scope.height = 9;
				break;
			case "boardSizeInt":
				$scope.width = 16;
				$scope.height = 16;
				break;
			case "boardSizeExp":
				$scope.width = 30;
				$scope.height = 16;
				break;
			case "boardSizeCus":
				$scope.width = $scope.boardSizeCus_width;
				$scope.height = $scope.boardSizeCus_height;
				break;
		}
		
		board = new Board($scope.width, $scope.height, 0);
		$scope.mines = 0;
		board.calculate3BV();
		$scope.bbbv = board.bbbv;
		clearResult();
		setEditorCounter();
		setResultCounter();
		
		$scope.cells = getCells();
		$scope.calculateBoardPx();
		setAllCellCSS_editor($scope.cells);
		
		document.getElementById('editor_tab').click();
    };
	
	function clearResult() {
		$scope.hasResult = false;
		$scope.zini = "??";
		$scope.zini_title = "Left clicks: 0<br/>Right clicks: 0<br/>Chords: 0";
		$scope.eff = "??";
		$scope.eff_title = "??";
		zini_path = [];
		
		clearDisplay();
	}	
	
	function clearDisplay() {
		$scope.isPlaying = false;
		$scope.currentStep = 0;
		$scope.replay_progress = 0;
		$scope.replay_cursor = {left:0,top:0,opacity:0};
	}
	
	function getCells() {
		var result = [];
		for (var j=0 ; j<board.height ; j++)
		{
			for (var i=0 ; i<board.width ; i++)
			{
				board.cells[i][j].id = j * board.width + i;
				result.push(board.cells[i][j]);
			}
		}
		return result;
	}
	
	$scope.clickCell = function(cell) {
		//console.log(cell.id + " " + cell.x + "," + cell.y);
		
		if (cell.number == -1)
		{
			cell.number = 0;
			$scope.mines--;
		}
		else
		{
			cell.number = -1;
			$scope.mines++;
		}
		setEditorCounter();
		setResultCounter();
		
		for (var i = Math.max(0, cell.x - 1); i <= Math.min(board.width - 1, cell.x + 1); i++)
		{
			for (var j = Math.max(0, cell.y- 1); j <= Math.min(board.height - 1, cell.y + 1); j++)
			{
				board.calculateNumber(board.cells[i][j]);
				setCellCSS_editor(board.cells[i][j]);
			}
		}
		board.calculate3BV();
		$scope.bbbv = board.bbbv;
		clearResult();
	};
	
	function setCellCSS_editor(cell) {
		if (cell.number == -1)
			cell.editor_css = "board-mine";
		else
			cell.editor_css = "board-" + cell.number;
	}
	
	function setCellCSS_result(cell) {
		cell.result_css = "board-closed";
		if ($scope.currentStep >= cell.progress)
		{
			if (cell.number == -1)
				cell.result_css = "flag";
			else
				cell.result_css = "board-" + cell.number;
		}
		if ($scope.highlightPath && cell.in_path && cell.number != -1)
		{
			cell.result_css += " highlight";
		}
		if ($scope.highlightMines && cell.in_path && cell.number == -1)
		{
			cell.result_css += " highlight-mine";
		}
	}
	
	function setAllCellCSS_editor(cells) {
		cells.forEach(cell => setCellCSS_editor(cell));
	}
	
	$scope.setAllCellCSS_result = function(cells) {
		cells.forEach(cell => setCellCSS_result(cell));
	};
	
	function setEditorCounter() {
		$scope.editorConter.d1 = $scope.mines % 10;
		$scope.editorConter.d2 = Math.floor($scope.mines/10) % 10;
		$scope.editorConter.d3 = Math.floor($scope.mines/100) % 10;
		$scope.editorConter.d4 = Math.floor($scope.mines/1000) % 10;
	}
	
	function setResultCounter() {
		var remain_mine = $scope.mines;
		if (zini_path.length > 0) {
			remain_mine -= zini_path.slice(0, Math.floor($scope.currentStep)).filter(z => z.click==2).length;
			if ($scope.currentStep >= board.zini)
				remain_mine = 0;
		}
		$scope.resultConter.d1 = remain_mine % 10;
		$scope.resultConter.d2 = Math.floor(remain_mine/10) % 10;
		$scope.resultConter.d3 = Math.floor(remain_mine/100) % 10;
		$scope.resultConter.d4 = Math.floor(remain_mine/1000) % 10;
	}
	
	$scope.showRandom = false;
	$scope.randomMines = 99;
	$scope.randomBoard = function() {
		$scope.newBoard();
		
		var mines = 0;
		switch ($scope.boardSize)
		{
			case "boardSizeBeg":
				mines = 10;
				break;
			case "boardSizeInt":
				mines = 40;
				break;
			case "boardSizeExp":
				mines = 99;
				break;
			case "boardSizeCus":
				$scope.randomMines = Math.round($scope.randomMines);
				if ($scope.randomMines < 0)
					$scope.randomMines = 0;
				if ($scope.randomMines > $scope.width*$scope.height)
					$scope.randomMines = $scope.width*$scope.height;
				mines = $scope.randomMines;
				break;
		}		
		
		var tempMineCount = 0;
		for (var i=0 ; i<$scope.width*$scope.height ; i++)
		{
			if (tempMineCount < mines)
			{
				$scope.cells[i].number = -1;
				tempMineCount++;
			}
			else
			{
				$scope.cells[i].number = 0;
			}
		}
		$scope.mines = mines;
		setEditorCounter();
		setResultCounter();
		
		//shuffle
		for (var i = 0; i < $scope.width*$scope.height; i++)
		{
			var index = Math.floor(Math.random() * ($scope.width*$scope.height-i))+i;
			var temp_number = $scope.cells[i].number;
			$scope.cells[i].number = $scope.cells[index].number;
			$scope.cells[index].number = temp_number;
		}
		board.calculateAllNumber();
		setAllCellCSS_editor($scope.cells);
		board.calculate3BV();
		$scope.bbbv = board.bbbv;
		clearResult();
	}
	
	$scope.calculate = async function() {
		clearDisplay();
		setQueryString();
		setCookieSetting();
		board.my_random_seed = getMinesString();
		
		if (board.bbbv == 0)
			return;
		
		board.calculateZiNi(getZiNiLoopCount());		
		
		if (board.zini != 0)
		{
			$scope.hasResult = true;
			$scope.zini = board.zini;
			zini_path = getSmoothZiNiPath(board.zini_path);
			console.log("zini_path = ");
			console.log(zini_path);
			
			var left_clicks = zini_path.filter(z => z.click==1).length;
			var right_clicks = zini_path.filter(z => z.click==2).length;
			var chord_clicks = zini_path.filter(z => z.click==3).length;
			$scope.zini_title = "Left clicks: " + left_clicks + "<br/>Right clicks: " + right_clicks + "<br/>Chords: " + chord_clicks;
			$scope.eff = Math.round(board.bbbv / board.zini * 100).toString() + "%";
			$scope.eff_title = (Math.round(board.bbbv / board.zini * 10000)/100).toString() + "%";
			
			setProgress();
			setHighlight();
			
			document.getElementById('result_tab').click();
		}
	};
	
	function getZiNiLoopCount() {
		var result = 1;
		
		if ($scope.ziniLoopType == "ziniLoopCountDynamic")
		{
			result = Math.round(100000/Math.pow(board.bbbv,1.5));
			if (result < 1)
				result = 1;
			if (result > 10000)
				result = 10000;
		}
		else
		{
			result = $scope.ziniLoopCountFixed;
		}
		console.log("ZiNi Loop Count = " + result);
		return result;
	}
	
	function getSmoothZiNiPath(zp) {
		var result = [];
		
		for (var i=0 ; i<zp.length ; i++)
			result.push(zp[i]);
		
		var opening_count = 0;
		for (var i=0 ; i<result.length ; i++)
		{
			if (board.cells[result[i].x][result[i].y].number == 0) //put opening click to first and find greedy shortest path
			{
				var temp = result.splice(i,1);
				result.unshift(temp[0]);
				opening_count++;
			}
		}
		sortByShortest(result, 0, opening_count);
		
		var closing_index = 0;
		for (var i=zp.length-1 ; i>=0 ; i--)
		{
			if (result[i].click == 3 || board.cells[result[i].x][result[i].y].number == 0) //closing move find greedy shortest path
			{
				closing_index = i+1;
				break;
			}
		}
		sortByShortest(result, closing_index, result.length);
		return result;
	}
	
	function sortByShortest(result, start_index, end_index) {
		for (var i=start_index ; i<end_index ; i++)
		{
			if (i==0)
				continue;
			var shortest = {index: i, distance: getDistance(result[i-1],result[i])};
			
			for (var j=i+1 ; j<end_index ; j++)
			{
				var distance = getDistance(result[i-1],result[j]);
				if (distance < shortest.distance)
				{
					shortest.distance = distance;
					shortest.index = j;
				}
			}
			var temp = result.splice(shortest.index,1);
			result.splice(i,0,temp[0]);
		}
	}
	
	function getDistance(p1,p2) {
		var dx = Math.abs(p2.x - p1.x);
		var dy = Math.abs(p2.y - p1.y);
		var dis = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
		return dis;
	}
	
	function setProgress() {
		$scope.cells.forEach(cell => cell.progress = 0);
		for (var i=0 ; i<zini_path.length ; i++)
		{
			var z = zini_path[i];
			
			if (z.click == 1) //left click
			{
				var c = board.cells[z.x][z.y];
				if (c.number == 0)
					$scope.cells.filter(cell => !cell.progress && cell.group==c.group && cell.number==0).forEach(function(f) {
						for (var i2 = Math.max(0, f.x - 1); i2 <= Math.min(board.width - 1, f.x + 1); i2++)
						{
							for (var j2 = Math.max(0, f.y - 1); j2 <= Math.min(board.height - 1, f.y + 1); j2++)
							{
								if (board.cells[i2][j2].progress)
									continue;
								board.cells[i2][j2].progress=(i+1);
							}
						}
					});
				c.progress = (i+1);
			}
			else if (z.click == 2) //right click
			{
				var c = board.cells[z.x][z.y];
				c.progress = (i+1);
			}
			else //chord
			{				
				for (var i2 = Math.max(0, z.x - 1); i2 <= Math.min(board.width - 1, z.x + 1); i2++)
				{
					for (var j2 = Math.max(0, z.y - 1); j2 <= Math.min(board.height - 1, z.y + 1); j2++)
					{
						var n = board.cells[i2][j2];
						
						if (n.progress)
							continue;
						
						if (n.number == 0)
							$scope.cells.filter(cell => !cell.progress && cell.group==n.group && cell.number==0).forEach(function(f) {
								for (var i3 = Math.max(0, f.x - 1); i3 <= Math.min(board.width - 1, f.x + 1); i3++)
								{
									for (var j3 = Math.max(0, f.y - 1); j3 <= Math.min(board.height - 1, f.y + 1); j3++)
									{
										if (board.cells[i3][j3].progress)
											continue;
										board.cells[i3][j3].progress=(i+1);
									}
								}
							});
						n.progress = (i+1);
					}
				}
			}
		}
		$scope.cells.filter(cell => !cell.progress).forEach(cell => cell.progress = zini_path.length);
	}
	
	function setHighlight() {
		$scope.cells.forEach(cell => cell.in_path = false);
		zini_path.forEach(z => board.cells[z.x][z.y].in_path = true);
		$scope.setAllCellCSS_result($scope.cells);
	}
	
	$scope.replay_start = function() {
		$scope.currentStep = 0;
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
	};
	
	$scope.replay_previous = function() {
		$scope.isPlaying = false;
		$scope.currentStep--;
		if ($scope.currentStep < 0)
			$scope.currentStep = 0;
		$scope.currentStep = Math.floor($scope.currentStep);
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
		setReplayCursor();
	};
	
	$scope.replay_play = function() {
		$scope.isPlaying = true;
		if ($scope.currentStep >= board.zini)
			$scope.currentStep = 0;
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
	};
	
	$scope.replay_pause = function() {
		$scope.isPlaying = false;
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
	};
	
	$scope.replay_next = function() {
		$scope.isPlaying = false;
		$scope.currentStep++;
		if ($scope.currentStep >= board.zini)
			$scope.currentStep = board.zini;
		$scope.currentStep = Math.floor($scope.currentStep);
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
		setReplayCursor();
	};
	
	$scope.replay_end = function() {
		$scope.isPlaying = false;
		$scope.currentStep = board.zini;
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
		setReplayCursor();
	};
	
	function setReplayProgress() {
		if (zini_path.length == 0)
			return;
		
		var replay_bar_width = document.getElementById('replay_bar').offsetWidth;
		$scope.replay_progress = $scope.currentStep / board.zini * replay_bar_width;
	}
	
	function setReplayBar($event) {		
		var replay_bar_width = document.getElementById('replay_bar').offsetWidth;
		$scope.currentStep = $event.offsetX / replay_bar_width * zini_path.length;
		if ($scope.currentStep >= zini_path.length-0.5)
			$scope.currentStep = zini_path.length;
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
		//console.log($event);
	}
	
	$scope.click_replayBar = function($event) {
		if (zini_path.length == 0)
			return;
		setReplayBar($event);
	};
	
	$scope.drag_replayBar = function($event) {
		if (zini_path.length == 0)
			return;
		var replay_bar_width = document.getElementById('replay_bar').offsetWidth;
		$scope.replay_tooltip.left = $event.offsetX + 9.5 - document.getElementById('replay_tooltip').offsetWidth/2;
		var step = Math.floor(Math.max(0,$event.offsetX) / replay_bar_width * zini_path.length);
		if (Math.max(0,$event.offsetX) / replay_bar_width * zini_path.length >= zini_path.length-0.5)
			step = zini_path.length;
		$scope.replay_tooltip.text = step + "/" + zini_path.length;
		if ($event.buttons != 1)
			return;
		setReplayBar($event);
	};
	
	function setReplayCursor() {
		if (zini_path.length == 0)
			return;
		var start = {left:0,top:0};
		var end = {left:0,top:0};
		var target = {left:0,top:0};
		
		var start_index = Math.floor($scope.currentStep);
		var end_index = Math.ceil($scope.currentStep);
		
		if (start_index > 0)
		{
			start.left = zini_path[start_index-1].x * $scope.tileSize;
			start.top = zini_path[start_index-1].y * $scope.tileSize;
		}
		if (end_index > 0)
		{
			end.left = zini_path[end_index-1].x * $scope.tileSize;
			end.top = zini_path[end_index-1].y * $scope.tileSize;
		}
		
		if (start_index == end_index)
		{
			target.left = start.left;
			target.top = start.top;
		}
		else
		{
			target.left = start.left + (end.left-start.left) * ($scope.currentStep-start_index);
			target.top = start.top + (end.top-start.top) * ($scope.currentStep-start_index);
		}
		
		if (target.left != $scope.replay_cursor.left || target.top != $scope.replay_cursor.top)
		{
			$scope.replay_cursor.opacity = 1;
		}
		$scope.replay_cursor.left = target.left;
		$scope.replay_cursor.top = target.top;
	}
	
	var replay_milliseconds = 25;
	function replay() {
		$scope.replay_cursor.opacity -= (replay_milliseconds / 1000);
		if ($scope.replay_cursor.opacity < 0)
			$scope.replay_cursor.opacity = 0;
		
		if (!$scope.isPlaying)
			return;
		if (!$scope.displaySpeed || $scope.displaySpeed <= 0)
			return;
		$scope.currentStep += (replay_milliseconds / $scope.displaySpeed);
		if ($scope.currentStep >= board.zini)
		{
			$scope.currentStep = board.zini;
			$scope.isPlaying = false;
		}
		$scope.setAllCellCSS_result($scope.cells);
		setResultCounter();
		setReplayProgress();
		setReplayCursor();
	}
	$interval(replay, replay_milliseconds);
	
	var result_board_width = 0;
	var result_board_height = 0;
	function resultBoardOnReSize() {
		var temp_width = document.getElementById('result_baord_outer').offsetWidth;
		var temp_height = document.getElementById('result_baord_outer').offsetHeight;
		if (result_board_width != temp_width || result_board_height != temp_height) {
			result_board_width = temp_width;
			result_board_height = temp_height;
			setReplayProgress();
			setReplayCursor();
		}
	}
	$interval(resultBoardOnReSize, 25);
	
	$scope.calculateBoardPx = function() {
		$scope.boardWidthPx = $scope.width * parseInt($scope.tileSize);
		$scope.boardHeightPx = $scope.height * parseInt($scope.tileSize);
	};
	
	window.mobileAndTabletCheck = function() {
		let check = false;
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	};

	function outputsize_editor() {
		var div = document.getElementById('editor_baord_inner');
		var hasHorizontalScrollbar = div.scrollWidth > div.clientWidth;
		var hasVerticalScrollbar = div.scrollHeight > div.clientHeight;
		
		$scope.boardScrollPx_EditorX = (!window.mobileAndTabletCheck() && hasVerticalScrollbar) ? 18 : 0;
		$scope.boardScrollPx_EditorY = (!window.mobileAndTabletCheck() && hasHorizontalScrollbar) ? 18 : 0;		
		
		$scope.$apply();
	}
	
	function outputsize_result() {
		var div = document.getElementById('result_baord_inner');
		var hasHorizontalScrollbar = div.scrollWidth > div.clientWidth;
		var hasVerticalScrollbar = div.scrollHeight > div.clientHeight;
		
		$scope.boardScrollPx_ResultX = (!window.mobileAndTabletCheck() && hasVerticalScrollbar) ? 18 : 0;
		$scope.boardScrollPx_ResultY = (!window.mobileAndTabletCheck() && hasHorizontalScrollbar) ? 18 : 0;		
		
		$scope.$apply();
	}
	
	new ResizeObserver(outputsize_editor).observe(editor_baord_inner);
	new ResizeObserver(outputsize_result).observe(result_baord_inner);
	
	window.getCookie = function(name) {
		var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
		if (match) return match[2];
	}

	function setCookieSetting() {
		var setting = {
			ziniLoopType : $scope.ziniLoopType,
			ziniLoopCountFixed : $scope.ziniLoopCountFixed,
			tileSize : $scope.tileSize,
			displaySpeed : $scope.displaySpeed,
			highlightPath : $scope.highlightPath,
			highlightMines : $scope.highlightMines
		};
		var cookie = JSON.stringify(setting);
		document.cookie = "setting" + "=" + cookie + "; expires=" + new Date(new Date().getTime()+1000*60*60*24*30).toGMTString();
	}
	
	function getCookieSetting() {
		var cookie = window.getCookie("setting");
		if (cookie) {
			var setting = JSON.parse(cookie);
			$scope.ziniLoopType = setting.ziniLoopType;
			$scope.ziniLoopCountFixed = setting.ziniLoopCountFixed;
			$scope.tileSize = setting.tileSize;
			$scope.displaySpeed = setting.displaySpeed;
			$scope.highlightPath = setting.highlightPath;
			$scope.highlightMines = setting.highlightMines;
		}
	}
	
	function showMain() {
		var main = document.getElementById('main');
		main.style.opacity = 0;

		function fade() {
			main.style.opacity = parseFloat(main.style.opacity) + 0.04;
			if(main.style.opacity < 1)
				setTimeout(fade,20);
		}
		setTimeout(fade,20);
	}
	
	function initial() {
		
		getCookieSetting();
		var url = new URLSearchParams(window.location.search);
		if (url.get('b'))
		{
			switch (url.get('b'))
			{
				case '1':
					$scope.boardSize = "boardSizeBeg";
					break;
				case '2':
					$scope.boardSize = "boardSizeInt";
					break;
				case '3':
					$scope.boardSize = "boardSizeExp";
					break;
				default:
					$scope.boardSize = "boardSizeCus";
					$scope.boardSizeCus_width = parseInt(url.get('b').substring(0,2));
					$scope.boardSizeCus_height = parseInt(url.get('b').substring(2,4));
					$scope.check_boardSizeCus_width();
					$scope.check_boardSizeCus_height();
					break;
			}
		}		
		$scope.newBoard();
		
		if (url.get('m'))
		{
			setByMinesString(url.get('m'));
			board.calculateAllNumber();
			setAllCellCSS_editor($scope.cells);
			board.calculate3BV();
			$scope.bbbv = board.bbbv;
			setEditorCounter();
			setResultCounter();
		}
		showMain();
	}
	initial();	
	
	var ptt = "";
	function addkey(e) {
        if (e.key == 'p') {
            ptt = "p";
        }
        else if (e.key == 't' && ptt == "p") {
            ptt = "pt";
        }
        else if (e.key == 't' && ptt == "pt") {
			$scope.showRandom = true;
			$scope.$apply();
        }
		else {
			ptt = "";
		}		
		
		if (e.key == 'n') {
			$scope.newBoard();
			$scope.$apply();
		}
		if (e.key == 'r') {
			$scope.randomBoard();
			$scope.$apply();
		}
		if (e.key == 'c') {
			$scope.calculate();
			$scope.$apply();
		}
	}
    document.addEventListener('keydown', addkey);	
	
  }]);
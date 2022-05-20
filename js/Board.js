class Board {
	
	constructor(width,height,mines) {
		this.width = width;
		this.height = height;
		this.mines = mines;
		this.cells = [];
		
		this.bbbv = 0;
		this.opening_count = 0;
		this.zini = 0;
		this.zini_path = [];
		
		this.my_random_seed = 0;
		this.my_random = new Math.seedrandom(this.my_random_seed);
		
		for (var i=0 ; i<width ; i++)
		{
			var a = [];
			for (var j=0 ; j<height ; j++)
			{
				a.push({
					x : i,
					y : j,
					number : 0
				});
			}
			this.cells.push(a);
		}
	}
	
	calculateMines() {
		this.mines = 0;
		for (var i=0 ; i<this.width ; i++)
		{
			for (var j=0 ; j<this.height ; j++)
			{
				if (this.cells[i][j].number == -1)
					this.mines++;
			}
		}
	}
	
	calculateAllNumber() {
		for (var i=0 ; i<this.width ; i++)
		{
			for (var j=0 ; j<this.height ; j++)
			{
				this.calculateNumber(this.cells[i][j]);
			}
		}
	}
	
	calculateNumber(cell) {
		if (cell.number == -1)
			return;		
		cell.number = this.arround(cell).filter(a => a.number == -1).length;
	}
	
	arround(cell) {
		var result = [];
		for (var i = Math.max(0, cell.x - 1); i <= Math.min(this.width - 1, cell.x + 1); i++)
		{
			for (var j = Math.max(0, cell.y - 1); j <= Math.min(this.height - 1, cell.y + 1); j++)
			{
				result.push(this.cells[i][j]);
			}
		}
		return result;
	}
	
	calculate3BV() {
		var current_group = 1;

		this.cells.forEach(e => e.forEach(cell => cell.group = 0));
		
		//先將0的分組
		this.cells.forEach(e => e.forEach(cell => {
			if (cell.group == 0 && cell.number == 0)
			{				
				cell.group = current_group;

				while (true)
				{
					var has_new = false;
					
					this.cells.forEach(f => f.forEach(cell2 => {
						if (cell2.group == current_group)
						{
							this.arround(cell2).forEach(a => {
								if (a.number == 0 && a.group == 0)
								{
									a.group = current_group;
									has_new = true;
								}
							});
						}
					}));
					
					if (!has_new)
						break;
				}
				current_group++;
			}
		}));
		this.opening_count = current_group - 1;

		//往外一層
		this.cells.forEach(e => e.forEach(cell => {
			if (cell.group != 0 || cell.number == -1)
				return;
			
			this.arround(cell).forEach(a => {				
				if (a.group != 0 && a.number == 0)
				{
					cell.group = a.group;
				}
			});
		}));
		
		//剩下的
		this.cells.forEach(e => e.forEach(cell => {
			if (cell.group != 0 || cell.number == -1)
				return;
			cell.group = current_group++;
		}));
		
		current_group--;
		this.bbbv = current_group;
	}
	
	calculateZiNi(loop_count) {
		this.my_random = new Math.seedrandom(this.my_random_seed);
		this.zini = 0;
		this.zini_path = [];
		
		for (var i=0 ; i<loop_count ; i++)
		{
			var random_zini_result = this.random_zini();
			
			if (this.zini > random_zini_result.zini || this.zini == 0)
			{
				this.zini = random_zini_result.zini;
				this.zini_path = random_zini_result.zini_path;
			}
		}
	}
	
	random_zini() {
		
		var result = {zini:0, zini_path:[]};

		this.cells.forEach(e => e.forEach(cell => cell.is_open = false));
		
		while (true)
		{
			var max_premium = -10;
			var max_index_lst = [];
			var max_index = {x:-1, y:-1};

			this.cells.forEach(e => e.forEach(cell => {
				if (cell.number == -1)
					return;
				var premium = 0; // [adjacent 3bv] - [adjacent unflagged mines] - 1_[if cell is closed] - 1
				var unflagged = 0;
				var temp_group = [];

				this.arround(cell).forEach(a => {
					if (a.is_open)
						return;
					if (a.number != -1)
					{
						if (a.group <= this.opening_count)
						{
							if (a.number == 0)
							{
								if (!temp_group.includes(a.group))
								{
									temp_group.push(a.group);
									premium++;
								}
							}
						}
						else
							premium++;
					}
					else
					{
						premium--;
						unflagged++;
					}
				});

				if (!cell.is_open)
					premium-=1.001;

				premium--;
				
				if (premium <=0 && cell.is_open && unflagged==0) // remove useless chord
					return;

				if (premium >= max_premium)
				{
					if (premium > max_premium)
						max_index_lst = [];
					max_premium = premium;
					max_index_lst.push(cell);
				}
			}));

			var choose_index = Math.floor(this.my_random() * max_index_lst.length);
			if (max_index_lst.length == 0)
				return result;
			var max_index = {x:max_index_lst[choose_index].x, y:max_index_lst[choose_index].y};

			if (max_premium >= 0)
			{
				if (!this.cells[max_index.x][max_index.y].is_open)
				{
					result.zini++;
					result.zini_path.push({x:max_index.x, y:max_index.y, click:1}); //left click
				}
				
				this.arround(max_index).forEach(a => {
					if (a.is_open)
						return;

					if (a.number == -1)
					{
						result.zini++;
						result.zini_path.push({x:a.x, y:a.y, click:2}); //right click
						a.is_open = true;
						return;
					}

					if (a.number == 0)
					{
						if (!a.is_open)
							this.open_opening(a);
					}
					else
					{
						a.is_open = true;
					}
				});
				
				result.zini++;
				result.zini_path.push({x:max_index.x, y:max_index.y, click:3}); //chord
			}
			else
			{
				var cell_lst = [];
				this.cells.forEach(e => e.forEach(cell => {
					if (cell.number == -1)
						return;
					if (cell.number != 0 && cell.group <= this.opening_count)
						return;
					if (cell.is_open)
						return;
					cell_lst.push(cell);
				}));
				
				choose_index = Math.floor(this.my_random() * cell_lst.length);
				var index_x = cell_lst[choose_index].x;
				var index_y = cell_lst[choose_index].y;

				result.zini++;
				result.zini_path.push({x:index_x, y:index_y, click:1}); //left click

				if (this.cells[index_x][index_y].number == 0)
				{
					this.open_opening(this.cells[index_x][index_y]);
				}
				else
				{
					this.cells[index_x][index_y].is_open = true;
				}
			}

			var check_is_all_open = true;
			this.cells.forEach(e => e.forEach(cell => {
				if (cell.number == -1)
					return;
				if (!cell.is_open)
					check_is_all_open = false;
			}));
			if (check_is_all_open)
				break;
		}
		return result;
	}
	
	open_opening(opening) {
		
		this.cells.forEach(e => e.forEach(cell => {
			if (cell.number == 0 && cell.group == opening.group)
			{
				cell.is_open = true;
				//往外一層
				this.arround(cell).forEach(a => {
					a.is_open = true;
				});
			}
		}));
	}
}
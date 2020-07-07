// Don't forget to pass --allow-file-access-from-files to chrome for use from a local drive.

var canvas;
var gCtx;

var memory = 64;
var dit_dah_sec =  new Array(memory);
var space_sec =  new Array(memory);
var dit_index = 0;
var space_index = 0;
var start_time_dit = 0;
var start_time_space = 0;
var dit_centroid = 0.080;
var dah_centroid = 0.240;
var held_tone = false;
var tone_hold = 0;
var sequence = "";
var dictionary={ 
	'-.': 'n', 
	'---': 'o', 
	'--.': 'g', 
	'.--': 'w', 
	'-.-': 'k', 
	'-..-': 'x', 
	'-...': 'b', 
	'-..': 'd', 
	'-': 't', 
	'...': 's', 
	'.': 'e', 
	'....': 'h', 
	'.-..': 'l', 
	'--': 'm', 
	'.--.': 'p', 
	'.---': 'j', 
	'..': 'i', 
	'.-': 'a', 
	'.-.': 'r', 
	'..-.': 'f', 
	'-.--': 'y', 
	'-.-.': 'c', 
	'..-': 'u', 
	'...-': 'v', 
	'--..': 'z', 
	'--.-': 'q',
	'-----': '0',
	'.----': '1',
	'..---': '2',
	'...--': '3',
	'....-': '4',
	'.....': '5',
	'-....': '6',
	'--...': '7',
	'---..': '8',
	'----.': '9',
	'.-.-': 'AA',
	'.-.-.': 'AR',
	'.-...': 'AS',
	'-...-.-': 'BK',
	'-...-': 'BT',
	'-.-..-..': 'CL',
	'-.-.-': 'CT',
	'-..---': 'DO',
	'-.--.': 'KN',
	'...-.-': 'SK',
	'...-.': 'SN',
	'...---': 'SO',
	'.-.-.-': '.',
	'--..--': ',',
	'..--..': '?',
	'.----.': '\'',
	'-.-.--': '!',
	'-..-.': '/',
	'-.--.': '(',
	'-.--.-': ')',
	'.-...': '&',
	'---...': ':',
	'-.-.-.': ';',
	'-...-': '=',
	'.-.-.': '+',
	'-....-': '-',
	'..--.-': '_',
	'.-..-.': '"',
	'...-..-': '$',
	'.--.-.': '@',
	'.--.-': 'à',
	'.-.-': 'ä',
	'-.-..': 'ç',
	'----': 'ch',
	'..-..': 'è',
	'.-..-': 'è',
	'--.-.': 'ĝ',
	'.---.': 'ĵ',
	'--.--': 'ñ',
	'..--.': 'ð',
	'---.': 'ö',
	'...-.': 'ŝ',
	'...-...': 'ś',
	'.--..': 'þ',
	'..--': 'ü',
	'--..-': 'ż',
	'--..-.': 'ź'
};

function reset_char() {
	sequence = "";
	document.getElementById('current').innerHTML = sequence;
};

function reset_all() {
	sequence = "";
	document.getElementById('current').innerHTML = sequence;
	document.getElementById('decoded').innerHTML = ">"; 
};

function init() {
  canvas = document.getElementById('c');
  gCtx = canvas.getContext('2d');
  
  navigator.webkitGetUserMedia({video:false, audio:true}, function(stream){
    audioContext = new webkitAudioContext();
    analyser = audioContext.createAnalyser();
    //analyser_avg = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor (1024, 1, 1);

    analyser.smoothingTimeConstant = 0.0;
    analyser.fftSize = 1024;

    //analyser_avg.smoothingTimeConstant = 0.99995;
    //analyser_avg.fftSize = 2048;

    microphone.connect(analyser);
    //microphone.connect(analyser_avg);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    canvasContext = gCtx;

	for (var i = 0; i < dit_dah_sec.length; i++) {
		dit_dah_sec[i] = new Array(1);
		dit_dah_sec[i][0] = 0;
		space_sec[i] = new Array(1);
		space_sec[i][0] = 0;
	}

	javascriptNode.onaudioprocess = function(event) {
        var array =  new Uint8Array(analyser.frequencyBinCount);
        var array_avgs =  new Uint8Array(analyser.frequencyBinCount);
        var values = 0;
        var length = array.length;
		var center_bin = +document.getElementById('center_bin').value;
		var width_bins = +document.getElementById('width_bins').value;
		var threshold_hi = +document.getElementById('threshold_hi').value;
		var threshold_lo = +document.getElementById('threshold_lo').value;
		var analyser_now = audioContext.currentTime

        analyser.getByteFrequencyData(array);
        //analyser_avg.getByteFrequencyData(array_avgs);
		
		canvasContext.clearRect(0, 0, 50+2*(length+1), 255);
		canvasContext.fillStyle = '#0000ff';
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        var average = values / length;
		var tone = undefined;
        for (var i = 0; i < length; i++) {
			var temp = (array[i] - average);//- array_avgs[i] - average);

			canvasContext.fillStyle = '#0000ff';

			if( i > ( center_bin - width_bins ) && i < ( center_bin + width_bins ) ) {
				canvasContext.fillStyle = '#ff0000';
				if ( temp > threshold_hi ) {
					tone = true;
					canvasContext.fillStyle = '#00ff00';
				}
				if ( temp < threshold_lo ) {
					tone = false;
					canvasContext.fillStyle = '#00ff00';
				}
			}

			canvasContext.fillRect(25+2*i, 255 - temp, 2, 255);
		}
		var delta_space = analyser_now - start_time_space;
		var delta_dit = analyser_now - start_time_dit;
		var delta_hold = analyser_now - tone_hold;
		
		if ( tone != undefined && held_tone != tone && delta_hold > 0.020 ) {
			tone_hold = analyser_now;
			held_tone = tone;
		}
		
		if ( held_tone ) {
			document.getElementById('beep').innerHTML = "*";
			if ( delta_dit >= delta_space ) { 
				start_time_dit = analyser_now;
				space_sec[ space_index ][0] = delta_space;
				display_space( space_sec );
				space_index = (space_index+1)%memory;
			}
		} else {
			document.getElementById('beep').innerHTML = " ";
			if ( delta_space > 1.0 && sequence.length > 0 ) {
				space_sec[ space_index ][0] = 1.0;
				display_space( space_sec );
			}
			if ( delta_dit <= delta_space ) {
				start_time_space = analyser_now;
				dit_dah_sec[ dit_index ][0] = delta_dit;
				display_dit( dit_dah_sec );
				dit_index = (dit_index+1)%memory;
			}
		}

		canvasContext.clearRect(0, 0, 20, 255);
        canvasContext.fillStyle = '#ffff00';
        canvasContext.fillRect(0, 255 - average, 25, 255);
        canvasContext.fillStyle = '#ff0000';
		canvasContext.fillRect(0, 255 - threshold_hi, 5, 255);
        canvasContext.fillStyle = '#00ff00';
		canvasContext.fillRect(0, 255 - threshold_lo, 5, 255);
		}

	})
}

function display_dit( dit_dah_sec ) {
	var clusters = figue.kmedians(2 , dit_dah_sec); //dit_clusters
	var vectors = dit_dah_sec;
	var red_group = 0;
	var blue_group = 1;

	var txt ;
	if (clusters) {
		txt = "<table border='1'>" ;
		txt += "<tr><th>Label</th><th>Vector</th><th>Type</th><th>Cluster id</th><th>Cluster centroid</th></tr>";

		var group = new Array(2);
		if ( clusters.centroids[0][0] < clusters.centroids[1][0] ) {
			group[0] = ".";
			group[1] = "-";
			red_group = 0;
			blue_group = 1;
			dit_centroid = clusters.centroids[0][0]
			dah_centroid = clusters.centroids[1][0]
		} else { 
			group[0] = "-"; 
			group[1] = ".";
			blue_group = 0;
			red_group = 1;
			dah_centroid = clusters.centroids[0][0]
			dit_centroid = clusters.centroids[1][0]
		}
		
		var dit_scatter_ctx = document.getElementById('dit_scatter').getContext('2d');
		dit_scatter_ctx.fillStyle = "rgba(1,1,1,0.02)";
		dit_scatter_ctx.fillRect( 0, 0, 1000, 256 );
		dit_scatter_ctx.fillStyle = '#00ff00';
		dit_scatter_ctx.fillRect( vectors[dit_index]*1000, dit_index, 1, 2 );
		for (var i = 0 ; i < vectors.length ; i++) {
			var index = clusters.assignments[i];
			txt += "<tr><td>" + i + "</td><td>" + vectors[i] + "</td><td>" + group[index] + "</td><td>" + index + "</td><td>" + clusters.centroids[index] + "</td></tr>";
		}
		txt += "</table>"
		
		dit_scatter_ctx.fillStyle = '#ff0000';
		dit_scatter_ctx.fillRect( clusters.centroids[red_group]*1000, dit_index, 1, 1 );
		dit_scatter_ctx.fillStyle = '#0000ff';
		dit_scatter_ctx.fillRect( clusters.centroids[blue_group]*1000, dit_index, 1, 1 );

		sequence += group[clusters.assignments[dit_index]];
		document.getElementById('current').innerHTML = sequence;

		/*
		if ( sequence.length > 4 ) {
			while ( dictionary[sequence] == undefined && sequence.length > 0 ) {
				sequence = sequence.slice(0,-1);
				if ( dictionary[sequence] != undefined ) {
					document.getElementById('decoded').innerHTML += dictionary[sequence];
					reset_char();
				}
			}
		}*/
		if ( sequence.length > 4 && dictionary[sequence] == undefined ) {
			document.getElementById('decoded').innerHTML += '_';
			reset_char();
		}
	} else {
		txt = "No result (too many clusters/too few different instances (try changing K)" ;
	}
	document.getElementById('text').innerHTML = txt; 
}

function display_space( space_sec ) {
	var space_scatter_ctx = document.getElementById('space_scatter').getContext('2d');
	space_scatter_ctx.fillStyle = "rgba(1,1,1,0.005)";
	space_scatter_ctx.fillRect( 0, 0, 1000, 128 );
	space_scatter_ctx.fillStyle = '#0000ff';
	space_scatter_ctx.fillRect( (dit_centroid + dah_centroid)*1000, space_index, 1, 10 );
	space_scatter_ctx.fillStyle = '#00ff00';
	space_scatter_ctx.fillRect( (dit_centroid + dah_centroid)/2*1000, space_index, 1, 10 );

	var space_sec_now = space_sec[space_index];
	
	var group = "element";
	space_scatter_ctx.fillStyle = '#ff0000';
	
	if ( space_sec_now > (dit_centroid + dah_centroid)/2 ) {
		group = "char";	
		space_scatter_ctx.fillStyle = '#00ff00';
	}

	if ( space_sec_now > 2*dah_centroid ) {
		group = "word";
		space_scatter_ctx.fillStyle = '#0000ff';
	}

	space_scatter_ctx.fillRect( space_sec_now*1000, space_index, 1, 2 );
	
	if ( group == "char" || group == "word" ) {
		while ( dictionary[sequence] == undefined && sequence.length > 0  ) {
			sequence = sequence.slice(1);
		} 
		if ( dictionary[sequence] != undefined ) {
			document.getElementById('decoded').innerHTML += dictionary[sequence];
		}
		reset_char();

		if ( group == "word" ) {
			document.getElementById('decoded').innerHTML += " "; 
		}
	}
	var txt = "<table border='1'>" ;
	txt += "<tr><th>dit_centroid</th><th>dah_centroid</th><th>space_sec_now</th></tr>";
	txt += "<tr><td>" + dit_centroid + "</td><td>" + dah_centroid + "</td><td>" + space_sec_now + "</td></tr>";	
	txt += "</table>"
	document.getElementById('text2').innerHTML = txt;
}

function reverse_lookup( associativeArray, value ) {
	return Object.keys(associativeArray).filter(function(key) {
		return associativeArray[key] == value;
	})
}

function morse_out() {
	var text_output = document.getElementById('text_out').value;
	var frequency_output = document.getElementById('freq_out').value;
	var dit_time = +document.getElementById('dit_time_sec').value;	
	var volume = +document.getElementById('volume').value;	
	
	var output = '';
	
	var i = 0, j = 0, time = 0, osc = null, gain = null;
	
	var audio_time = audioContext.currentTime + dit_time;

	for(i = 0; i < text_output.length; i++) {
		char_seq = reverse_lookup( dictionary, text_output[i] )[0];
		if ( char_seq == undefined ) {
			char_seq = '';
			audio_time += 7*dit_time;
		} else {
			audio_time += 3*dit_time;
		}
		output += char_seq + ' ';
		
		for( j = 0; j < char_seq.length; j++) {
			if ( char_seq[j] == '.' || char_seq[j] == '-' ) {
				osc = audioContext.createOscillator();
				osc.frequency.value = frequency_output;
				gain = audioContext.createGainNode();
				gain.connect(audioContext.destination);
				gain.gain.value = volume;
				osc.connect(gain);
				osc.start( audio_time );
				if ( char_seq[j] == '.' ) {
					audio_time += dit_time;
				} else {
					audio_time += 3*dit_time;
				}
				osc.stop( audio_time );
			}
			audio_time += dit_time;
		}
	} 

	document.getElementById('morse_text').value = output;
}
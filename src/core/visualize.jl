export element_color, ball_and_stick, van_der_waals

const VISUALIZE = ES6Module(asset_path("visualize_structure.js"))::Asset

sp = Base.source_path()

const ELEMENT_COLORS = [
	(255, 255, 255),   # HYDROGEN 1
	(216, 255, 255),   # HELIUM 2
	(205, 126, 255),   # LITHIUM 3
	(196, 255, 000),   # BERYLLIUM 4
	(255, 182, 182),   # BORON 5
	(144, 144, 144),   # CARBON 6
	(142, 142, 255),   # NITROGEN 7
	(240, 000, 000),   # OXYGEN 8
	(179, 255, 255),   # FLUORINE 9
	#10
	(175, 226, 244),   # NEON 10
	(170,  93, 242),   # SODIUM 11
	(137, 255, 000),   # MAGNESIUM 12
	(209, 165, 165),   # ALUMINIUM 13    
	(128, 154, 154),   # SILICON 14
	(255, 128, 000),   # PHOSPHORUS 15
	(255, 200,  40),   # SULPHUR 16
	( 26, 240,  26),   # CHLORINE 17
	(128, 209, 228),   # ARGON 18
	(142,  65, 211),   # POTASSIUM 19
	#20
	( 61, 255, 000),   # CALCIUM 20
	(230, 230, 228),   # SCANDIUM 21
	(191, 195, 198),   # TITANIUM 22
	(167, 165, 172),   # VANADIUM 23
	(137, 153, 198),   # CHROMIUM 24
	(156, 123, 198),   # MANGANESE 25
	(128, 123, 198),   # IRON 26
	( 93, 109, 255),   # COBALT 27
	( 93, 123, 195),   # NICKEL 28
	(255, 123,  98),   # COPPER 29
	#30                  
	(124, 128, 175),   # ZINC 30
	(195, 144, 144),   # GALLIUM 31
	(102, 144, 144),   # GERMANIUM 32
	(188, 128, 226),   # ARSENIC 33
	(255, 161, 000),   # SELENIUM 34
	(165,  33,  33),   # BROMINE 35
	( 93, 186, 209),   # KRYPTON 36
	(112,  45, 177),   # RUBIDIUM 37
	(000, 255, 000),   # STRONTIUM 38
	(149, 253, 255),   # YTTRIUM 39
	#40
	(149, 225, 225),   # ZIRCONIUM 40
	(116, 195, 203),   # NIOBIUM 41
	( 84, 181, 182),   # MOLYBDENUM 42
	( 59, 158, 168),   # TECHNETIUM 43
	( 35, 142, 151),   # RUTHENIUM 44  
	( 10, 124, 140),   # RHODIUM 45
	(000, 105, 133),   # PALLADIUM 46
	(153, 198, 255),   # SILVER 47
	(255, 216, 144),   # CADMIUM 48
	(167, 117, 114),   # INDIUM 49
	#50
	(102, 128, 128),   # TIN 50
	(158, 100, 181),   # ANTIMONY 51
	(212, 123,   0),   # TELLURIUM 52
	(147, 000, 147),   # IODINE 53
	( 66, 158, 175),   # XENON 54
	( 86,  24, 142),   # CAESIUM 55
	(  0, 203,   0),   # BARIUM 56
	(112, 221, 255),   # LANTHANUM 57
	(255, 255, 255),   # CERIUM 58   -----
	(255, 255, 255),   # PRASEODYMIUM 59          
	#60
	(255, 255, 255),   # NEODYMIUM 60
	(255, 255, 255),   # PROMETHIUM 61
	(255, 255, 255),   # SAMARIUM 62
	(255, 255, 255),   # EUROPIUM 63
	(255, 255, 255),   # GADOLINIUM 64
	(255, 255, 255),   # TERBIUM 65
	(255, 255, 255),   # DYSPROSIUM 66
	(255, 255, 255),   # HOLMIUM 67
	(255, 255, 255),   # ERBIUM 68
	(255, 255, 255),   # THULIUM 69
	#70
	(255, 255, 255),   # YTTERBIUM 70
	(255, 255, 255),   # LUTETIUM 71
	( 77, 193, 255),   # HAFNIUM 72
	( 77, 167, 255),   # TANTALUM 73
	( 38, 147, 214),   # TUNGSTEN 74         
	( 38, 126, 172),   # RHENIUM 75
	( 38, 103, 151),   # OSMIUM 76
	( 24,  84, 135),   # IRIDIUM 77
	( 24,  91, 144),   # PLATINUM 78
	(255, 209,  35),   # GOLD 79
	#80
	(181, 181, 195),   # MERCURY 80
	(167,  84,  77),   # THALLIUM 81
	( 80,  89,  96),   # LEAD 82
	(158,  79, 181),   # BISMUTH 83
	(172,  93,   0),   # POLONIUM 84
	(117,  79,  68),   # ASTATINE 85
	( 66, 131, 151),   # RADON 86
	( 66,   0, 102),   # FRANCIUM 87
	(  0, 124,   0),   # RADIUM 88       
	(112, 170, 251),   # ACTINIUM 89
	#90
	(255, 255, 255),   # THORIUM 90
	(255, 255, 255),   # PROTACTINIUM 91
	(255, 255, 255),   # URANIUM 92
	(255, 255, 255),   # NEPTUNIUM 93
	(255, 255, 255),   # PLUTONIUM 94
	(255, 255, 255),   # AMERICIUM 95
	(255, 255, 255),   # CURIUM 96
	(255, 255, 255),   # BERKELIUM 97
	(255, 255, 255),   # CALIFORNIUM 98
	(255, 255, 255),   # EINSTEINIUM 99
	#100
	(255, 255, 255),   # FERMIUM 100
	(255, 255, 255),   # MENDELEVIUM 101
	(255, 255, 255),   # NOBELIUM 102
	(255, 255, 255),   # LAWRENCIUM 103        
	(255, 255, 255),   # RUTHERFORDIUM 104
	(255, 255, 255),   # HAHNIUM 105
	(255, 255, 255),   # SEABORGIUM 106
	(255, 255, 255),   # BOHRIUM 107
	(255, 255, 255),   # HASSIUM 108
	(255, 255, 255),   # MEITNERIUM 109
	(255, 255, 255)    # DUBNIUM 105
	#110
]

hex_colors = [hex(RGB((e ./ 255)...)) for e in ELEMENT_COLORS]

element_color(e) = "0x"*lowercase(hex_colors[Int(e)])

function prepare_model(ac::AbstractAtomContainer)
	raw_atoms = atoms_df(ac).idx
	spheres = atoms_df(ac).r;
	colors = [element_color(e) for e in atoms_df(ac).element];
	sticks = [(findfirst(==(b.a1), raw_atoms), findfirst(==(b.a2), raw_atoms)) for b in bonds(ac)];
	midpoints = map(b -> (
		a1=spheres[b[1]];
		a2=spheres[b[2]];
		a1 + 0.5*(a2 - a1)),
		sticks
	);

	spheres, colors, sticks, midpoints
end

function display_model(ac::AbstractAtomContainer; type="BALL_AND_STICK")
	app = App() do session, request
		width = 500; height = 500
		dom = DOM.div(width = width, height = height)

		spheres, colors, sticks, midpoints = prepare_model(ac)

		# compute the center of mass of the geometry
		focus_point = mean(spheres)

		JSServe.onload(session, dom, js"""
			function (container){
				$(VISUALIZE).then(VISUALIZE => {
					console.log("test")
					let { 
						renderer,
						scene, 
						camera } = VISUALIZE.setup(container, $width, $height);

					if ($type == "BALL_AND_STICK") {
						VISUALIZE.ballAndStickModel(scene, $spheres, $sticks, $midpoints, $colors);
					} else {
						VISUALIZE.VanDerWaals(scene, $spheres, $colors);
					}

					let controls = VISUALIZE.setupControls(renderer, scene, camera, $focus_point);

					controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

					render();
						
					function animate() {         
						requestAnimationFrame( animate );                  
						controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true              
						render();
					}

					function render() {
						renderer.render( scene, camera );
					}
				})
			}
		""")
		return dom
	end
end

ball_and_stick(ac) = display_model(ac; type="BALL_AND_STICK")
van_der_waals(ac)  = display_model(ac; type="VAN_DER_WAALS")
 using BiochemicalAlgorithms
 using BiochemicalVisualization
 
 # create a new system
 h2o = System()

 # create system atoms
 o1 = Atom(h2o, 1, Elements.O)
 h1 = Atom(h2o, 2, Elements.H)
 h2 = Atom(h2o, 3, Elements.H)
 
 # set positions of the atoms
 # o1.r = Vector3{Float}(0, 0, 0)  <-- this is the default value!
 h1.r = Vector3{Float32}(1, 0, 0)
 h2.r = Vector3{Float32}(cos(105 * π / 180), sin(105 * π / 180), 0)
 
 # add bonds
 Bond(h2o, o1.idx, h1.idx, BondOrder.Single)
 Bond(h2o, o1.idx, h2.idx, BondOrder.Single)
 
 # visualize the system
 ball_and_stick(h2o)
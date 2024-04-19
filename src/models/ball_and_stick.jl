function prepare_ball_and_stick_model(
        ac::AbstractAtomContainer{T}; 
        sphere_radius=T(0.4), 
        stick_radius=T(0.2)) where {T<:Real}

    spheres = map(a -> Sphere(a.r, sphere_radius), atoms(ac))
    sphere_colors = [element_color(e) for e in atoms(ac).element]

    sticks = [(atom_by_idx(ac, b.a1), 
            atom_by_idx(ac, b.a2)) for b in bonds(ac)]

    println(sticks)

    midpoints = map(s -> (s[1].r + T(0.5)*(s[2].r - s[1].r)), sticks)

    cylinders = collect(Iterators.flatten(map(((s,m),) -> (
        Cylinder(s[1].r, m, stick_radius), 
        Cylinder(m, s[2].r, stick_radius)), zip(sticks, midpoints))))
    cylinder_colors = collect(Iterators.flatten(
        map(s -> (element_color(s[1].element), element_color(s[2].element)), sticks)))

    Representation{T}(primitives=Dict("spheres" => spheres, "cylinders" => cylinders), colors=Dict("sphere_colors" => sphere_colors, "cylinder_colors" => cylinder_colors))
end
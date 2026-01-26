-- Add description column to levels
alter table public.levels add column description text;

update public.levels
set description = case level_number
  when 1 then 'Du hast gerade deine erste Ausgabe getracked und bist offiziell:'
  when 2 then 'Du bringst den Stein ins Rollen! Deine Ausdauer macht sich jetzt bezahlt:'
  when 3 then 'Echte Glanzleistung! Deine finanzielle Disziplin ist jetzt auf Profi-Niveau:'
  when 4 then 'Einfach unaufhaltsam! Du spielst jetzt offiziell in der obersten Liga:'
  when 5 then 'Legendär! Du hast das Sparen offiziell durchgespielt und bist ein wahres Vorbild:'
  else name
end;

alter table public.levels alter column description set not null;

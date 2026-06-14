import { createSupabaseServerClient } from '@/lib/supabase-server';

export class SkillMapper {
  /**
   * Deduplicates, upserts global skills, and links them to the target job.
   */
  static async mapJobSkills(
    jobId: string,
    requiredSkills: string[],
    preferredSkills: string[]
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // 1. Clear existing links to support safe retries
    await supabase.from('job_skills').delete().eq('job_id', jobId);

    const uniqueSkillsMap = new Map<string, { name: string; category: 'frontend' | 'backend' | 'devops' | 'design' | 'management' | 'other'; isPreferred: boolean }>();

    const addSkills = (list: string[], isPreferred: boolean) => {
      for (const rawName of list) {
        const name = rawName.trim();
        if (!name) continue;
        const normalizedName = name.toLowerCase();
        // If it's already in the map, required takes precedence (isPreferred = false)
        const existing = uniqueSkillsMap.get(normalizedName);
        if (existing) {
          if (!isPreferred) {
            existing.isPreferred = false;
          }
        } else {
          uniqueSkillsMap.set(normalizedName, {
            name,
            category: this.guessCategory(name),
            isPreferred,
          });
        }
      }
    };

    addSkills(requiredSkills, false);
    addSkills(preferredSkills, true);

    const skillPayloads = Array.from(uniqueSkillsMap.values()).map(s => ({
      name: s.name,
      category: s.category
    }));

    if (skillPayloads.length > 0) {
      // 2. Batch upsert into skills
      const { data: skillRows, error: upsertError } = await supabase
        .from('skills')
        .upsert(skillPayloads, { onConflict: 'name' })
        .select('id, name');

      if (upsertError || !skillRows) {
        console.error('Skills batch upsert failed for job mapper:', upsertError);
        throw upsertError || new Error('Skills batch upsert failed.');
      }

      // Create mapping of name.toLowerCase() to id
      const nameToIdMap = new Map<string, string>();
      skillRows.forEach((row: any) => {
        nameToIdMap.set(row.name.toLowerCase(), row.id);
      });

      // 3. Batch insert into job_skills
      const jobSkillRows = Array.from(uniqueSkillsMap.entries()).map(([normalizedName, s]) => {
        const id = nameToIdMap.get(normalizedName);
        if (!id) return null;
        return {
          job_id: jobId,
          skill_id: id,
          is_preferred: s.isPreferred,
        };
      }).filter((row): row is { job_id: string; skill_id: string; is_preferred: boolean } => row !== null);

      if (jobSkillRows.length > 0) {
        const { error: linkError } = await supabase
          .from('job_skills')
          .upsert(jobSkillRows, { onConflict: 'job_id,skill_id' });

        if (linkError) {
          console.error('Job skills batch link failed:', linkError);
          throw linkError;
        }
      }
    }
  }

  /**
   * Heuristically classifies extracted skill text to its respective table category.
   */
  private static guessCategory(name: string): 'frontend' | 'backend' | 'devops' | 'design' | 'management' | 'other' {
    const n = name.toLowerCase();
    if (['react', 'vue', 'nextjs', 'next.js', 'angular', 'html', 'css', 'sass', 'tailwind', 'javascript', 'typescript', 'frontend', 'ui', 'ux'].some(k => n.includes(k))) {
      return 'frontend';
    }
    if (['node', 'express', 'django', 'python', 'go', 'golang', 'rust', 'c++', 'java', 'sql', 'postgres', 'supabase', 'mongodb', 'mysql', 'prisma', 'backend'].some(k => n.includes(k))) {
      return 'backend';
    }
    if (['docker', 'kubernetes', 'aws', 'gcp', 'ci/cd', 'terraform', 'jenkins', 'devops', 'azure', 'cloud'].some(k => n.includes(k))) {
      return 'devops';
    }
    if (['figma', 'sketch', 'photoshop', 'illustrator', 'ui/ux', 'product design', 'design'].some(k => n.includes(k))) {
      return 'design';
    }
    if (['scrum', 'agile', 'pmp', 'product manager', 'jira', 'management', 'roadmap', 'planning', 'lead'].some(k => n.includes(k))) {
      return 'management';
    }
    return 'other';
  }
}

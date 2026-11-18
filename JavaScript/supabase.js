
import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

// Dados do seu projeto Supabase
const SUPABASE_URL = "https://brpuaitgzjavdbvkqzef.supabase.co";
const SUPABASE_KEY = "sb_publishable_gmf4XtJI9rb0LHx_9Zcvug_WkahS_pB";

// Criando a conexão
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);